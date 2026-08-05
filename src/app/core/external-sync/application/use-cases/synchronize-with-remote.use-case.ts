import { inject, Injectable } from '@angular/core';
import { CredentialsProvider } from '@core/_common/credentials/credentials-provider';
import {
  ExportableData,
  ExportedRow,
  ExportedRows,
  ExportRef,
} from '@core/_common/export/exportable-data';
import { ImportableData } from '@core/_common/import/importable-data';
import { Logger } from '@core/_common/logger/logger';
import { UseCase } from '@core/_common/use-case';
import { SyncTargetRepository } from '../../domain/repositories/sync-target.repository';
import { DeviceIdentity } from '../../domain/services/device-identity';
import { SyncGateway } from '../../domain/services/sync.gateway';
import { SyncReader } from '../../domain/services/sync-reader';
import { SyncShadow } from '../../domain/services/sync-shadow';
import { SyncStatus } from '../../domain/services/sync-status';
import { SyncBatch } from '../../domain/value-objects/sync-batch';
import { SyncTarget } from '../../domain/value-objects/sync-target';
import {
  localVersionsFrom,
  MergePlan,
  PlannedApply,
  PlannedPush,
  reconcile,
} from '../../infrastructure/reconcile';
import { canonicalCode } from '../../infrastructure/sheet-canonical';
import { SHEET_TABLES } from '../../infrastructure/sheet-schema';

export type SyncStopReason = 'disconnected' | 'no-target' | 'blocked' | 'stale-session' | 'failed';

export interface SynchronizeWithRemoteResult {
  readonly synced: boolean;
  /** Cuántas filas se trajeron, se subieron y se borraron aquí. */
  readonly applied: number;
  readonly pushed: number;
  readonly removed: number;
  /** Filas del destino que no se pueden leer. Se cuentan para poder avisar. */
  readonly rejected: number;
  readonly reason?: SyncStopReason;
}

/**
 * **El ciclo**: bajar, fusionar y subir. En ese orden, siempre.
 *
 * Es lo que convierte el destino en la fuente de la verdad. El anterior `Synchronize` solo subía la
 * cola; este mira antes lo que hay al otro lado y decide fila a fila.
 *
 * ## Nunca se sube a ciegas
 *
 * Subir sin haber leído es lo que pisa el trabajo de otro dispositivo. Aquí la subida es siempre la
 * **consecuencia** de una comparación: solo se suben las filas que ganaron, y con la huella y la versión
 * que salieron de esa misma decisión.
 *
 * ## El orden de los pasos no es negociable
 *
 * 1. **Puerta**: credenciales y destino. Sin eso no hay ciclo.
 * 2. **Bajar** el destino entero, de una vez.
 * 3. **Poner al día su forma** si hace falta. Antes de escribir, o aparecerían columnas sin nombre.
 * 4. **Fusionar**, que decide sin tocar nada.
 * 5. **Aplicar** aquí lo que ganó allí, actualizando la base **fila a fila**.
 * 6. **Subir** lo que ganó aquí.
 * 7. **Apuntar la base** de lo subido y de lo adoptado.
 *
 * El 5 antes del 6 importa: si se subiera primero y el proceso muriera, el destino tendría cambios que
 * aquí no están y la base no lo sabría.
 *
 * ## La base se escribe fila a fila, no al final
 *
 * Si el proceso muriera entre «apliqué cuarenta filas» y «apunté la base», esas cuarenta parecerían
 * cambios locales en el ciclo siguiente y **se subirían de vuelta con una versión nueva y contenido
 * viejo**, ganándole a una edición legítima de otro dispositivo. Por eso cada fila aplicada apunta su
 * base inmediatamente.
 *
 * ## Nunca lanza
 *
 * Informa del desenlace y deja el motivo en el resultado y en el estado, como `Synchronize`. Un ciclo
 * que lanza deja al usuario con un error y sin saber si sus datos están.
 */
@Injectable({ providedIn: 'root' })
export class SynchronizeWithRemote extends UseCase<void, SynchronizeWithRemoteResult> {
  private readonly credentials = inject(CredentialsProvider);
  private readonly targets = inject(SyncTargetRepository);
  private readonly reader = inject(SyncReader);
  private readonly gateway = inject(SyncGateway);
  private readonly shadow = inject(SyncShadow);
  private readonly source = inject(ExportableData);
  private readonly sink = inject(ImportableData);
  private readonly device = inject(DeviceIdentity);
  private readonly status = inject(SyncStatus);
  private readonly log = inject(Logger).scoped('external-sync/cycle');

  /** El ciclo en marcha, si hay uno. Dos ciclos a la vez se pisarían escribiendo. */
  private running: Promise<SynchronizeWithRemoteResult> | null = null;

  execute(): Promise<SynchronizeWithRemoteResult> {
    // Un solo ciclo a la vez, y quien llegue mientras comparte el resultado. Sin esto, el disparo por
    // foco y el periódico podrían solaparse y escribir los dos.
    this.running ??= this.perform().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private async perform(): Promise<SynchronizeWithRemoteResult> {
    this.log.debug('ciclo ▶');

    const credentials = await this.credentials.current();
    if (!credentials) {
      this.status.markDisconnected();
      this.log.debug('ciclo omitido: no hay cuenta conectada');
      return stopped('disconnected');
    }

    const target = await this.targets.forAccount(credentials.accountId);
    if (!target) {
      this.log.debug('ciclo omitido: esta cuenta no tiene destino');
      return stopped('no-target');
    }

    const { epoch } = credentials;
    try {
      this.status.markSyncing();
      const outcome = await this.cycle(credentials.token, target);

      // La sesión pudo cambiar mientras se hablaba con el destino: si ahora hay otra cuenta, lo leído
      // y lo escrito eran de la anterior y no se puede tocar nada más con ellos.
      if (await this.sessionChanged(epoch)) {
        this.log.debug('ciclo descartado: la sesión cambió mientras corría');
        return stopped('stale-session');
      }
      return outcome;
    } catch (error) {
      this.log.warn('el ciclo ha fallado; nada se ha perdido, se reintenta', error, {
        accountId: credentials.accountId,
      });
      this.status.markFailed(describe(error));
      return stopped('failed');
    }
  }

  private async cycle(token: string, target: SyncTarget): Promise<SynchronizeWithRemoteResult> {
    const [snapshot, shadow, local, deviceId] = await Promise.all([
      this.reader.read({ credential: token, target }),
      this.shadow.all(),
      this.source.export({ all: true, refs: [] }),
      this.device.current(),
    ]);

    // Antes de escribir nada: si la hoja es de una versión anterior, ponerle la forma de ahora. Es
    // idempotente y con una hoja al día no cuesta ninguna llamada.
    await this.gateway.migrate({ credential: token, target, snapshot });

    const plan = await reconcile({
      snapshot,
      shadow,
      local,
      tables: SHEET_TABLES,
      now: Date.now(),
      deviceId,
      localVersionOf: localVersionsFrom(local, SHEET_TABLES, deviceId),
    });

    if (plan.aborted) {
      // Una barrera no es un error de red: es el destino diciendo que algo no cuadra, y aplicar a medias
      // sería peor que no aplicar. El usuario tiene que enterarse.
      this.log.warn('el ciclo se ha negado a seguir', undefined, { motivo: plan.aborted });
      this.status.markFailed(blockedMessage(plan.aborted.kind, plan.aborted.table));
      return { ...stopped('blocked'), rejected: 0 };
    }

    const applied = await this.applyRemote(plan);
    const pushed = await this.pushLocal(token, target, plan, local, deviceId);
    // Lo adoptado va al final y **respeta lo que ya se apuntó**: una fila que se adoptó y además se
    // rechazó al aplicarla ya tiene su marca de cuarentena, y volver a escribirla sin ella la haría
    // reintentarse en cada ciclo para siempre.
    await this.adopt(plan, applied.touched);

    this.status.markSynced(target, new Date().toISOString());
    this.log.debug('ciclo ✔', {
      aplicadas: applied.applied,
      subidas: pushed,
      borradas: applied.removed,
      rechazadas: applied.rejected,
      adoptadas: plan.adopt.length,
      conflictos: plan.conflicts.length,
    });
    return {
      synced: true,
      applied: applied.applied,
      pushed,
      removed: applied.removed,
      rejected: applied.rejected,
    };
  }

  /**
   * Trae lo que ganó en el destino y apunta su base fila a fila.
   *
   * Devuelve además **qué filas quedaron apuntadas**, para que la adopción no las vuelva a escribir: una
   * fila que se adoptó y luego se rechazó ya lleva su marca de cuarentena, y perderla la haría
   * reintentarse en cada ciclo.
   */
  private async applyRemote(plan: MergePlan): Promise<{
    applied: number;
    removed: number;
    rejected: number;
    touched: ReadonlySet<string>;
  }> {
    const touched = new Set<string>();
    if (plan.apply.length === 0 && plan.remove.length === 0) {
      return { applied: 0, removed: 0, rejected: 0, touched };
    }

    const outcome = await this.sink.apply({
      tables: tablesToApply(plan.apply),
      deleted: plan.remove.flatMap((removal) => refFor(removal.table, removal.rowId) ?? []),
    });

    const versions = new Map(plan.apply.map((row) => [`${row.table}:${row.rowId}`, row]));
    for (const ref of outcome.applied) {
      const table = tableForAggregate(ref.aggregate);
      const row = table ? versions.get(`${table}:${canonicalCode(ref.id)}`) : undefined;
      if (table && row) {
        await this.shadow.put({
          table,
          rowId: row.rowId,
          fingerprint: row.fingerprint,
          version: row.version,
          deleted: false,
        });
        touched.add(`${table}:${row.rowId}`);
      }
    }

    // Lo borrado se olvida de la base: ya no está ni allí ni aquí.
    for (const removal of plan.remove) {
      await this.shadow.remove(removal.table, removal.rowId);
      touched.add(`${removal.table}:${removal.rowId}`);
    }

    // Una fila rechazada se recuerda **con la huella que tenía al fallar**, y así no se reintenta en
    // cada ciclo: solo cuando el humano cambie esa celda. Y no se sobrescribe nunca — escribirle
    // nuestro valor encima borraría su intento de corrección.
    for (const rejection of outcome.rejected) {
      const table = tableForAggregate(rejection.ref.aggregate);
      const row = table ? versions.get(`${table}:${canonicalCode(rejection.ref.id)}`) : undefined;
      if (table && row) {
        await this.shadow.put({
          table,
          rowId: row.rowId,
          fingerprint: row.fingerprint,
          version: row.version,
          deleted: false,
          rejected: rejection.reason,
        });
        touched.add(`${table}:${row.rowId}`);
      }
    }

    return {
      applied: outcome.applied.length,
      removed: plan.remove.length,
      rejected: outcome.rejected.length,
      touched,
    };
  }

  /** Sube lo que ganó aquí, con su huella y su versión, y apunta su base. */
  private async pushLocal(
    token: string,
    target: SyncTarget,
    plan: MergePlan,
    local: ExportedRows,
    deviceId: string,
  ): Promise<number> {
    if (plan.push.length === 0) {
      return 0;
    }

    const rows = rowsToPush(plan.push, local, deviceId);
    const batch = SyncBatch.of(rows, crypto.randomUUID(), new Date().toISOString());
    if (batch.isEmpty) {
      return 0;
    }

    await this.gateway.send({ credential: token, target, batch });

    // La base se apunta **después** de que el destino confirme: si se apuntara antes y el envío
    // fallara, el ciclo siguiente creería que ya está subido y no lo reintentaría.
    for (const push of plan.push) {
      await this.shadow.put({
        table: push.table,
        rowId: push.rowId,
        fingerprint: push.fingerprint,
        version: push.version,
        deleted: false,
      });
    }
    return batch.total;
  }

  /** Apunta como base lo que se adoptó del destino, sin aplicarlo ni subirlo. */
  private async adopt(plan: MergePlan, touched: ReadonlySet<string>): Promise<void> {
    for (const row of plan.adopt) {
      if (touched.has(`${row.table}:${row.rowId}`)) {
        continue;
      }
      await this.shadow.put({
        table: row.table,
        rowId: row.rowId,
        fingerprint: row.fingerprint,
        version: row.version,
        deleted: row.deleted,
      });
    }
  }

  private async sessionChanged(epoch: number): Promise<boolean> {
    const current = await this.credentials.current();
    if (!current) {
      this.status.markDisconnected();
      return true;
    }
    return current.epoch !== epoch;
  }
}

function stopped(reason: SyncStopReason): SynchronizeWithRemoteResult {
  return { synced: false, applied: 0, pushed: 0, removed: 0, rejected: 0, reason };
}

/** Las filas a aplicar, agrupadas por tabla como espera el contrato del origen. */
function tablesToApply(apply: readonly PlannedApply[]): ExportedRows {
  const tables: Record<string, ExportedRow[]> = {};
  for (const row of apply) {
    tables[row.table] = [...(tables[row.table] ?? []), row.values];
  }
  return tables;
}

/**
 * Las filas a subir, con sus columnas de servicio puestas.
 *
 * La huella y la versión salen del **plan**, no se recalculan: el contenido y su huella tienen que
 * escribirse juntos y salir de la misma decisión, o la fila parecería editada a mano en el ciclo
 * siguiente.
 */
function rowsToPush(
  push: readonly PlannedPush[],
  local: ExportedRows,
  deviceId: string,
): ExportedRows {
  const tables: Record<string, ExportedRow[]> = {};

  for (const row of push) {
    const source = (local[row.table] ?? []).find(
      (candidate) => canonicalCode(keyOf(candidate, row.table)) === row.rowId,
    );
    if (!source) {
      continue;
    }
    tables[row.table] = [
      ...(tables[row.table] ?? []),
      { ...source, version: row.version, origen: deviceId, huella: row.fingerprint, borrado: '' },
    ];
  }

  // Una receta viaja con sus líneas: la tabla de líneas se reemplaza por padre, así que hay que mandar
  // las de cada receta que sube o el destino se quedaría con las de antes.
  const recipes = new Set(
    (tables['recipes'] ?? []).map((row) => canonicalCode(keyOf(row, 'recipes'))),
  );
  if (recipes.size > 0) {
    tables['recipeLines'] = (local['recipeLines'] ?? []).filter((line) =>
      recipes.has(canonicalCode(keyOf(line, 'recipeLines'))),
    );
  }
  return tables;
}

function keyOf(row: ExportedRow, table: string): unknown {
  const key = SHEET_TABLES.find((candidate) => candidate.name === table);
  const field = key?.key ?? key?.parentKey ?? 'id';
  return (row as Record<string, unknown>)[field];
}

/** El agregado que guarda una tabla, para hablarle al origen en sus términos. */
function refFor(table: string, rowId: string): ExportRef | null {
  const aggregate = SHEET_TABLES.find((candidate) => candidate.name === table)?.aggregate;
  return aggregate ? { aggregate, id: rowId } : null;
}

function tableForAggregate(aggregate: string): string | undefined {
  return SHEET_TABLES.find((candidate) => candidate.aggregate === aggregate)?.name;
}

/** Lo que se le enseña al usuario cuando una barrera para el ciclo. */
function blockedMessage(kind: string, table: string): string {
  const of = SHEET_TABLES.find((candidate) => candidate.name === table)?.title ?? table;
  switch (kind) {
    case 'missing-table':
      return `Falta la pestaña «${of}» en tu hoja. No se ha tocado nada.`;
    case 'headers':
      return `Las columnas de «${of}» no están donde deberían. No se ha tocado nada.`;
    default:
      return `Se borrarían demasiadas filas de «${of}». No se ha tocado nada.`;
  }
}

function describe(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'No se ha podido sincronizar con tu hoja.';
}
