import { inject, Injectable } from '@angular/core';
import { CredentialsProvider } from '@core/_common/credentials/credentials-provider';
import { StoreName } from '@core/_common/infrastructure/indexeddb/database';
import { Logger } from '@core/_common/logger/logger';
import { UseCase } from '@core/_common/use-case';
import { LocalRepository, TableRow } from '../../domain/repositories/local.repository';
import { RemoteRepository, RemoteWrite } from '../../domain/repositories/remote.repository';
import { SyncTargetRepository } from '../../domain/repositories/sync-target.repository';
import { DeviceIdentity } from '../../domain/services/device-identity';
import { reconcile } from '../../domain/services/engine/reconcile';
import { SyncOutbox } from '../../domain/services/sync-outbox';
import { SyncShadow, ShadowRow } from '../../domain/services/sync-shadow';
import { SyncStatus } from '../../domain/services/sync-status';
import { SyncError } from '../../domain/services/sync.gateway.types';
import { SyncTarget } from '../../domain/value-objects/sync-target';
import { planToWrites } from '../../infrastructure/sheets/plan-to-writes';
import { translateTable, TranslatedTable } from '../../infrastructure/sheets/remote-registros';

/**
 * **Las tablas que se replican.** Solo estas se duplican aquí y en el destino.
 *
 * Añadir una tabla a la sincronización es añadir su nombre a este array, y nada más: las columnas se
 * deducen de los datos, así que no hay esquema que tocar ni columnas que declarar. Quitarla es
 * borrarla de aquí — sus filas se quedan donde estén, en los dos sitios, sin tocarse más.
 *
 * Son nombres de **object store de IndexedDB**, tipados con `StoreName`, así que una errata no
 * compila. Los stores de servicio (`sync_*`, `seed_state`, `auth_session_hint`) no están y no deben
 * estar: son el andamiaje de este contexto, no datos del usuario.
 */
export const SYNCED_TABLES: readonly StoreName[] = [
  'ingredients',
  'recipes',
  'recipe_categories',
  'flavors',
  'conversion_options',
];

/**
 * Cuántas filas puede borrar una persona de una tabla antes de que el ciclo se niegue a seguir.
 *
 * Una lectura a medias es indistinguible de un borrado real, y aplicar un borrado masivo equivocado lo
 * propaga a todos los dispositivos a la vez. El tope no distingue el accidente — no puede— pero
 * convierte una pérdida total en una pregunta.
 */
const MASS_DELETE_ROWS = 20;
const MASS_DELETE_RATIO = 0.3;
/** Por debajo de esto la proporción no dice nada: en una tabla de tres filas, una es el 33 %. */
const MASS_DELETE_FLOOR = 4;

export type SyncStopReason =
  'disconnected' | 'no-target' | 'blocked' | 'stale-session' | 'stale-target' | 'failed';

export interface SynchronizeRequest {
  /**
   * `true` = decidir y contar, **sin escribir en ningún lado**. Es «Comprobar la hoja».
   *
   * Es el mismo ciclo con la mitad de abajo cortada, y por eso es el mismo caso de uso: una simulación
   * escrita aparte acabaría divergiendo del ciclo real y diría que todo está bien justo cuando no lo
   * está.
   */
  readonly dryRun?: boolean;
}

export interface TableOutcome {
  readonly pushed: number;
  readonly applied: number;
  readonly removed: number;
  readonly merged: number;
}

export interface SynchronizeResult {
  /** La respuesta a «¿está todo sincronizado?», en un solo valor. */
  readonly synced: boolean;
  readonly reason?: SyncStopReason;
  readonly movements: TableOutcome;
  readonly problems: {
    /** Ids repetidos en el destino. Hay que arreglarlos a mano. */
    readonly duplicates: number;
    /** Filas del destino con una celda que no se puede leer. */
    readonly unreadable: number;
    /** Filas locales que no se pudieron tener en cuenta. */
    readonly ignored: number;
    /** Por qué se negó a seguir, si se negó. */
    readonly barrier: string | null;
  };
  readonly byTable: Readonly<Record<string, TableOutcome>>;
}

/**
 * **El ciclo**: bajar, decidir y subir. En ese orden, siempre.
 *
 * Es el **único** sitio del que se llama al motor. Todo lo que decide qué gana vive en
 * `domain/services/engine/`, que no sabe qué es una hoja de cálculo; todo lo que sabe qué es una hoja
 * vive en `infrastructure/sheets/`, que no decide nada. Aquí solo se orquesta: se lee, se traduce, se
 * pregunta, y se aplica lo que salga.
 *
 * ## Nunca se sube a ciegas
 *
 * Subir sin haber leído es lo que pisa el trabajo de otro dispositivo. La subida es siempre la
 * **consecuencia** de una comparación: solo suben las filas que ganaron, con la huella y la versión
 * que salieron de esa misma decisión.
 *
 * ## El orden de los pasos no es negociable
 *
 * 1. **Puerta**: credenciales y destino. Sin eso no hay ciclo.
 * 2. **Leer los dos lados a la vez**, y comprobar que la hoja sigue siendo la de esta cuenta.
 * 3. **Barreras**: si algo no cuadra, no se toca nada — ni aquí ni allí.
 * 4. **Decidir**, tabla por tabla.
 * 5. **Bajar** lo que ganó el destino, en bloque.
 * 6. **Subir** lo que ganó aquí, todo en una sola escritura.
 * 7. **Recordar** (el shadow) solo lo que ya está confirmado en los dos lados.
 *
 * El 5 antes que el 6 importa: si se subiera primero y el proceso muriera, la hoja tendría cambios que
 * aquí no están y el shadow no lo sabría. Y el 7 al final, por la misma razón: el shadow es el ancestro
 * del ciclo siguiente, y un ancestro que describe una escritura que no ocurrió hace que el motor
 * atribuya al destino cambios que fueron locales — perdiéndolos en silencio.
 */
@Injectable({ providedIn: 'root' })
export class SynchronizeTables extends UseCase<SynchronizeRequest, SynchronizeResult> {
  private readonly credentials = inject(CredentialsProvider);
  private readonly targets = inject(SyncTargetRepository);
  private readonly local = inject(LocalRepository);
  private readonly remote = inject(RemoteRepository);
  private readonly shadow = inject(SyncShadow);
  private readonly device = inject(DeviceIdentity);
  private readonly outbox = inject(SyncOutbox);
  private readonly status = inject(SyncStatus);
  private readonly log = inject(Logger).scoped('external-sync/cycle');

  /** El ciclo de escritura en marcha, si hay uno. Dos a la vez se pisarían. */
  private running: Promise<SynchronizeResult> | null = null;

  async execute(request: SynchronizeRequest = {}): Promise<SynchronizeResult> {
    if (request.dryRun === true) {
      // Una simulación no se adelanta a una escritura en curso: contaría lo que esa escritura está a
      // punto de resolver y diría que hay pendiente algo que ya no lo está.
      await this.running?.catch(() => undefined);
      return this.perform(true);
    }

    const outcome = await this.share();

    /*
     * Un ciclo descartado porque la hoja cambió a mitad **no es la respuesta de quien preguntó**: se le
     * da un ciclo de verdad, ya contra la hoja nueva. Pasa al conectar la cuenta, cuando la pantalla
     * reemplaza una hoja que estaba en la papelera mientras el ciclo ya estaba leyendo la vieja.
     *
     * Una sola vez: si vuelve a cambiar, lo recoge el disparador siguiente. Reintentar en bucle
     * convertiría una carrera en un ciclo infinito.
     */
    return outcome.reason === 'stale-target' ? this.share() : outcome;
  }

  private share(): Promise<SynchronizeResult> {
    this.running ??= this.perform(false).finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private async perform(dryRun: boolean): Promise<SynchronizeResult> {
    this.log.debug('ciclo ▶', { dryRun });

    const credentials = await this.credentials.current();
    if (!credentials) {
      // Si ya se había sincronizado en esta sesión, esto no es «no hay cuenta»: es «se caducó». El
      // token de Google dura una hora y en un navegador no hay refresh token, así que pasa siempre — y
      // lo que hay que hacer (volver a entrar) no es lo mismo que conectar por primera vez.
      if (this.status.snapshot().target !== null) {
        this.status.markNeedsReconnect();
        this.log.debug('ciclo omitido: hay que volver a conectar');
      } else {
        this.status.markDisconnected();
        this.log.debug('ciclo omitido: no hay cuenta conectada');
      }
      return stopped('disconnected');
    }

    const target = await this.targets.forAccount(credentials.accountId);
    if (!target) {
      this.log.debug('ciclo omitido: esta cuenta no tiene destino');
      return stopped('no-target');
    }

    const { epoch } = credentials;
    try {
      if (!dryRun) {
        this.status.markSyncing();
      }
      const outcome = await this.cycle(
        credentials.token,
        target,
        credentials.accountId,
        epoch,
        dryRun,
      );

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
        dryRun,
      });
      if (!dryRun) {
        this.status.markFailed(describe(error));
      }
      return stopped('failed');
    }
  }

  private async cycle(
    token: string,
    target: SyncTarget,
    accountId: string,
    epoch: number,
    dryRun: boolean,
  ): Promise<SynchronizeResult> {
    const now = Date.now();
    const [snapshot, shadow, locals, deviceId] = await Promise.all([
      this.remote.read({ credential: token, target, tables: SYNCED_TABLES }),
      this.shadow.all(),
      Promise.all(SYNCED_TABLES.map((table) => this.local.all(table))),
      this.device.current(),
    ]);

    /*
     * La hoja pudo cambiar mientras se leía, y entonces lo leído no vale: se escribiría en la hoja que
     * el usuario acaba de abandonar, y el shadow quedaría describiendo filas que la hoja nueva no
     * tiene — con lo que el ciclo siguiente vería el catálogo entero como borrado a mano y la barrera
     * lo abortaría **para siempre**, dejando la hoja nueva vacía.
     */
    if (await this.targetChanged(accountId, target)) {
      this.log.debug('ciclo descartado: la hoja de la cuenta cambió mientras se leía');
      return stopped('stale-target');
    }

    const localByTable = new Map<string, readonly TableRow[]>(
      SYNCED_TABLES.map((table, index) => [table, locals[index]]),
    );
    const translated: TranslatedTable[] = [];
    for (const remote of snapshot.tables) {
      translated.push(
        await translateTable({
          remote,
          local: localByTable.get(remote.table) ?? [],
          shadow: shadow.filter((row) => row.table === remote.table),
          now,
          deviceId,
          newIdentity: () => crypto.randomUUID(),
        }),
      );
    }

    const blocked = translated.find((table) => table.barrier !== null);
    if (blocked?.barrier) {
      return this.refuse(blocked.barrier, dryRun);
    }

    const massDelete = translated.find((table) => isMassDelete(table));
    if (massDelete) {
      return this.refuse(
        `se borrarían ${massDelete.handDeletes} filas de «${massDelete.table}» de una vez`,
        dryRun,
      );
    }

    const writes: RemoteWrite[] = [];
    const apply = new Map<string, readonly TableRow[]>();
    const remember: ShadowRow[] = [];
    const byTable: Record<string, TableOutcome> = {};
    let duplicates = 0;
    let unreadable = 0;
    let ignored = 0;

    for (const table of translated) {
      const plan = reconcile({ base: table.base, data: table.data, now, originId: deviceId });
      const resolved = await planToWrites({ translated: table, plan, deviceId, now });

      writes.push(...resolved.writes);
      apply.set(table.table, resolved.apply);
      remember.push(...resolved.remember);
      byTable[table.table] = {
        pushed: plan.push.length,
        // Las filas que solo reciben su fecha NO cuentan como datos que bajan: su contenido no ha
        // cambiado. Contarlas anunciaría un cambio de catálogo cada vez que se rellena una fecha de
        // fábrica, y la primera sincronización de un dispositivo nuevo las rellena todas de golpe.
        applied: resolved.apply.length - resolved.deletions - resolved.restamped,
        removed: resolved.deletions,
        merged: plan.conflicts.filter((conflict) => conflict.winner === 'merged').length,
      };
      duplicates += plan.duplicates.length;
      ignored += plan.ignored.length;
      unreadable += snapshot.tables.find((t) => t.table === table.table)?.unreadable.length ?? 0;
    }

    const movements = totalOf(byTable);
    if (dryRun) {
      this.log.debug('simulación ✔', { ...movements, duplicates, unreadable, ignored });
      return {
        synced: movements.pushed + movements.applied + movements.removed === 0,
        movements,
        problems: { duplicates, unreadable, ignored, barrier: null },
        byTable,
      };
    }

    /*
     * La sesión pudo cerrarse mientras se leía la hoja, y entonces **no se puede escribir nada aquí**.
     *
     * Cerrar sesión vacía la base local a propósito (ver `SignOut`): un ciclo que empezó antes y
     * aterriza después la repoblaría con lo que acababa de bajar, y el aparato quedaría con datos de
     * alguien que ya se fue. Lo mismo vale si entró OTRA cuenta: lo leído es de la anterior.
     *
     * Se comprueba **antes de escribir** y no solo al final: la comprobación de `perform` llega tarde
     * para esto — descarta el resultado, pero lo aplicado ya está en disco.
     */
    if (await this.sessionChanged(epoch)) {
      this.log.debug('ciclo descartado antes de escribir: la sesión cambió mientras se leía');
      return stopped('stale-session');
    }

    // Bajar primero: si se subiera antes y el proceso muriera, la hoja tendría cambios que aquí no
    // están y el shadow no lo sabría.
    for (const table of SYNCED_TABLES) {
      await this.local.putAll(table, apply.get(table) ?? []);
    }

    if (writes.length > 0) {
      await this.remote.write({ credential: token, target, writes });
    }

    // Y el shadow al final, con lo que ya está confirmado en los dos lados.
    await this.shadow.putAll(remember);
    await this.outbox.clear();
    this.status.markSynced(target, new Date(now).toISOString());
    if (movements.applied + movements.removed > 0) {
      this.status.markDataChanged();
    }

    this.log.debug('ciclo ✔', { ...movements, duplicates, unreadable, ignored });
    return {
      synced: true,
      movements,
      problems: { duplicates, unreadable, ignored, barrier: null },
      byTable,
    };
  }

  /** Negarse a seguir: no se toca nada, ni aquí ni allí, y se dice por qué. */
  private refuse(barrier: string, dryRun: boolean): SynchronizeResult {
    this.log.warn('el ciclo se ha negado a seguir', undefined, { barrier });
    if (!dryRun) {
      this.status.markFailed(`La hoja necesita una revisión: ${barrier}.`);
    }
    return {
      ...stopped('blocked'),
      problems: { duplicates: 0, unreadable: 0, ignored: 0, barrier },
    };
  }

  private async sessionChanged(epoch: number): Promise<boolean> {
    const current = await this.credentials.current();
    return current === null || current.epoch !== epoch;
  }

  private async targetChanged(accountId: string, target: SyncTarget): Promise<boolean> {
    const current = await this.targets.forAccount(accountId);
    return current === null || !current.equals(target);
  }
}

function isMassDelete(table: TranslatedTable): boolean {
  const total = table.base.length;
  if (total < MASS_DELETE_FLOOR) {
    return false;
  }
  return table.handDeletes > MASS_DELETE_ROWS || table.handDeletes > total * MASS_DELETE_RATIO;
}

function totalOf(byTable: Readonly<Record<string, TableOutcome>>): TableOutcome {
  return Object.values(byTable).reduce(
    (total, table) => ({
      pushed: total.pushed + table.pushed,
      applied: total.applied + table.applied,
      removed: total.removed + table.removed,
      merged: total.merged + table.merged,
    }),
    { pushed: 0, applied: 0, removed: 0, merged: 0 },
  );
}

function stopped(reason: SyncStopReason): SynchronizeResult {
  return {
    synced: false,
    reason,
    movements: { pushed: 0, applied: 0, removed: 0, merged: 0 },
    problems: { duplicates: 0, unreadable: 0, ignored: 0, barrier: null },
    byTable: {},
  };
}

/** Lo que se le enseña a alguien cuando el ciclo falla. Nunca el error crudo. */
function describe(error: unknown): string {
  return error instanceof SyncError
    ? error.message
    : 'No se ha podido sincronizar. Se reintentará solo.';
}
