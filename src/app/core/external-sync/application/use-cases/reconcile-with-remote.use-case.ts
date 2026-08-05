import { inject, Injectable } from '@angular/core';
import { CredentialsProvider } from '@core/_common/credentials/credentials-provider';
import { ExportableData } from '@core/_common/export/exportable-data';
import { Logger } from '@core/_common/logger/logger';
import { UseCase } from '@core/_common/use-case';
import { SyncTargetRepository } from '../../domain/repositories/sync-target.repository';
import { DeviceIdentity } from '../../domain/services/device-identity';
import { SyncReader } from '../../domain/services/sync-reader';
import { SyncShadow } from '../../domain/services/sync-shadow';
import { localVersionsFrom, MergePlan, reconcile } from '../../infrastructure/reconcile';
import { SHEET_TABLES } from '../../infrastructure/sheet-schema';

export type ReconcileSkipReason = 'disconnected' | 'no-target' | 'failed';

export interface ReconcileWithRemoteResult {
  readonly reconciled: boolean;
  readonly plan: MergePlan | null;
  readonly reason?: ReconcileSkipReason;
}

/**
 * Compara el destino con lo de aquí y **cuenta lo que haría**. No aplica nada, no escribe nada.
 *
 * ## Por qué existe un caso de uso que no hace nada
 *
 * Porque los dos fallos que pueden hundir este motor **no se pueden ver en un test**:
 *
 * 1. **Que la canonización no sea determinista.** Si el mismo precio da una cadena distinta según venga
 *    del modelo o de una celda, cada fila parece editada a mano en cada ciclo y dos dispositivos se
 *    pisan para siempre. En un test los dos lados atraviesan el mismo código en el mismo proceso, así
 *    que coinciden por accidente. Solo se ve contra una hoja de verdad, con los números de verdad de
 *    alguien.
 * 2. **Que una columna que la app recalcula esté contando como dato.** Aquí saldría como diferencia
 *    permanente en las cuarenta recetas de una categoría.
 *
 * Los dos se leen de un vistazo en `drift`: con la canonización bien, ahí solo hay cambios de verdad;
 * con la canonización mal, sale el catálogo entero fallando por el mismo campo.
 *
 * Y se leen **sin poder hacer daño**. Lo que este caso de uso jamás toca: la hoja del usuario, sus
 * agregados locales y la base. Se puede dejar corriendo días antes de que exista nada que aplique.
 *
 * ## Nunca lanza
 *
 * Informa del desenlace y deja el motivo en el resultado, como `Synchronize`. Un diagnóstico que tumba
 * la app no es un diagnóstico.
 */
@Injectable({ providedIn: 'root' })
export class ReconcileWithRemote extends UseCase<void, ReconcileWithRemoteResult> {
  private readonly credentials = inject(CredentialsProvider);
  private readonly targets = inject(SyncTargetRepository);
  private readonly reader = inject(SyncReader);
  private readonly shadow = inject(SyncShadow);
  private readonly source = inject(ExportableData);
  private readonly device = inject(DeviceIdentity);
  private readonly log = inject(Logger).scoped('external-sync/reconcile');

  async execute(): Promise<ReconcileWithRemoteResult> {
    this.log.debug('simulación de fusión ▶');

    const credentials = await this.credentials.current();
    if (!credentials) {
      this.log.debug('simulación omitida: no hay cuenta conectada');
      return { reconciled: false, plan: null, reason: 'disconnected' };
    }

    const target = await this.targets.forAccount(credentials.accountId);
    if (!target) {
      this.log.debug('simulación omitida: esta cuenta no tiene destino', {
        accountId: credentials.accountId,
      });
      return { reconciled: false, plan: null, reason: 'no-target' };
    }

    try {
      const [snapshot, shadow, local, deviceId] = await Promise.all([
        this.reader.read({ credential: credentials.token, target }),
        this.shadow.all(),
        this.source.export({ all: true, refs: [] }),
        this.device.current(),
      ]);

      const plan = await reconcile({
        snapshot,
        shadow,
        local,
        tables: SHEET_TABLES,
        now: Date.now(),
        deviceId,
        // Con esto un conflicto se decide con dato en vez de a ciegas: el origen dice cuándo se guardó
        // cada fila aquí, y eso ya es comparable con la versión que trae el destino.
        localVersionOf: localVersionsFrom(local, SHEET_TABLES, deviceId),
      });

      this.report(plan);
      return { reconciled: true, plan };
    } catch (error) {
      // El diagnóstico no puede tumbar nada, pero su fallo tampoco puede desaparecer: si la lectura no
      // funciona, eso ES el resultado del diagnóstico.
      this.log.warn('la simulación de fusión ha fallado', error, {
        accountId: credentials.accountId,
      });
      return { reconciled: false, plan: null, reason: 'failed' };
    }
  }

  /**
   * El informe. Se registra en `debug` porque es una herramienta de desarrollo, y se registran
   * **cuentas y ejemplos**, nunca el catálogo entero: `"debug": true` en la configuración lo enciende.
   *
   * Las diferencias sí salen con su valor, y es la única excepción: sin ver `'2.5'` frente a `'2,50'` no
   * se puede diagnosticar el fallo que este caso de uso existe para encontrar. Son datos del propio
   * usuario en su propia consola, no salen a ningún sitio.
   */
  private report(plan: MergePlan): void {
    if (plan.aborted) {
      this.log.warn('la fusión se habría negado a seguir', undefined, { motivo: plan.aborted });
      return;
    }

    this.log.debug('simulación de fusión ✔', {
      adoptar: plan.adopt.length,
      aplicar: plan.apply.length,
      borrar: plan.remove.length,
      subir: plan.push.length,
      altasAMano: plan.handAdds.length,
      idsCambiados: plan.reids.length,
      idsDuplicados: plan.duplicates.length,
      enCuarentena: plan.quarantined.length,
      conflictos: plan.conflicts.length,
      diferencias: plan.drift.length,
    });

    if (plan.drift.length > 0) {
      // Agrupado por campo: si la canonización estuviera mal, un solo campo se llevaría casi todas las
      // diferencias y se vería en esta línea sin leer nada más.
      const porCampo = new Map<string, number>();
      for (const drift of plan.drift) {
        const key = `${drift.table}.${drift.field}`;
        porCampo.set(key, (porCampo.get(key) ?? 0) + 1);
      }
      this.log.debug('diferencias por campo', { campos: Object.fromEntries(porCampo) });
      this.log.debug('primeras diferencias', { ejemplos: plan.drift.slice(0, 10) });
    }

    for (const list of [plan.duplicates, plan.quarantined, plan.reids] as const) {
      if (list.length > 0) {
        this.log.warn('el destino tiene filas que habría que arreglar a mano', undefined, {
          ejemplos: list.slice(0, 5),
        });
      }
    }
  }
}
