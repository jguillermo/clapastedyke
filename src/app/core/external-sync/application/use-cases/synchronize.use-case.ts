import { inject, Injectable } from '@angular/core';
import { UseCase } from '@core/_common/use-case';
import { EventBus } from '@core/_common/eventbus/event-bus';
import { CredentialsProvider } from '@core/_common/credentials/credentials-provider';
import { ExportableData } from '@core/_common/export/exportable-data';
import { SyncEvents } from '../../domain/events/sync-events';
import { SyncGateway } from '../../domain/services/sync.gateway';
import { SyncError } from '../../domain/services/sync.gateway.types';
import { SyncOutbox } from '../../domain/services/sync-outbox';
import { SyncStatus } from '../../domain/services/sync-status';
import { SyncBatch } from '../../domain/value-objects/sync-batch';
import { SyncItem } from '../../domain/value-objects/sync-item';

export interface SynchronizeRequest {
  /**
   * `all` empuja todo lo que el origen sepa proyectar (al conectar la cuenta y con el botón
   * «Sincronizar todo»); `pending` solo lo que hay en la cola (lo que dispara cada guardado).
   */
  scope: 'all' | 'pending';
  /**
   * Limita la sincronización a un agregado concreto, p. ej. `'recipe'`. Ausente = todos.
   *
   * El nombre lo define quien publica los cambios y lo entiende el origen; este caso de uso solo lo
   * pasa de largo, así que sirve igual para un recetario que para cualquier otra cosa.
   */
  aggregate?: string;
}

export type SyncSkipReason = 'disconnected' | 'nothing-pending' | 'stale-session' | 'failed';

export interface SynchronizeResult {
  synced: boolean;
  rows: number;
  reason?: SyncSkipReason;
}

/**
 * Sincroniza datos con el destino externo donde el usuario guarda su copia.
 *
 * Orquestación pura entre dos puertos: pide la credencial de la sesión, le pide las filas al
 * **origen**, se las manda al **destino** y actualiza el estado. No sabe de dónde salen los datos ni
 * a dónde van — ni recetario, ni URL, ni proveedor.
 *
 * Dos detalles que sostienen el aislamiento entre cuentas:
 *
 * 1. **Guarda de sesión.** Se apunta el `epoch` antes de salir a la red y se comprueba al volver. Si
 *    el usuario cerró sesión o cambió de cuenta mientras la petición estaba en vuelo, el resultado se
 *    descarta: nunca se escribe con las credenciales de una sesión que ya murió.
 * 2. **La cola solo se vacía cuando el envío se confirma.** Los cambios se *toman* (`take`) y quedan
 *    en vuelo; se retiran (`ack`) al confirmarse el envío y vuelven (`requeue`) en cualquier otro
 *    desenlace. Nunca hay un instante en el que un cambio no esté ni en la cola ni enviado. En
 *    `scope: 'all'` no se toma nada —se relee el origen completo—, así que ambas llamadas son un
 *    no-op sobre una lista vacía.
 */
@Injectable({ providedIn: 'root' })
export class Synchronize extends UseCase<SynchronizeRequest, SynchronizeResult> {
  private readonly credentials = inject(CredentialsProvider);
  private readonly source = inject(ExportableData);
  private readonly gateway = inject(SyncGateway);
  private readonly outbox = inject(SyncOutbox);
  private readonly status = inject(SyncStatus);
  private readonly bus = inject(EventBus);

  async execute({ scope, aggregate }: SynchronizeRequest): Promise<SynchronizeResult> {
    const credentials = await this.credentials.current();
    if (!credentials) {
      this.status.markDisconnected();
      return { synced: false, rows: 0, reason: 'disconnected' };
    }

    const items = scope === 'pending' ? await this.dequeue(aggregate) : [];
    if (scope === 'pending' && items.length === 0) {
      return { synced: false, rows: 0, reason: 'nothing-pending' };
    }

    this.status.markSyncing();

    try {
      const rows = await this.source.export({ all: scope === 'all', refs: items, aggregate });
      const batch = SyncBatch.of(rows, crypto.randomUUID(), new Date().toISOString());

      if (batch.isEmpty) {
        // El origen no proyectó ninguna fila para estos cambios (p. ej. el dato ya no existe): no
        // hay nada que enviar y tampoco nada que reintentar, así que quedan resueltos.
        await this.outbox.ack(items);
        this.status.markConnected();
        return { synced: true, rows: 0 };
      }

      const outcome = await this.gateway.send({ credential: credentials.token, batch });

      if (await this.sessionChanged(credentials.epoch)) {
        // El envío salió, pero con la credencial de una sesión que ya no es la actual. Los cambios
        // vuelven a la cola: si hay otra cuenta, le pertenecen a ella; si se cerró sesión, el
        // suscriptor de salida vacía la cola de todos modos.
        await this.outbox.requeue(items);
        return { synced: false, rows: 0, reason: 'stale-session' };
      }

      await this.outbox.ack(items);
      this.status.markSynced(outcome.target, batch.syncedAt);
      await this.bus.publish([SyncEvents.succeeded(outcome.target.id, batch.total)]);
      return { synced: true, rows: batch.total };
    } catch (error) {
      await this.outbox.requeue(items);
      if (await this.sessionChanged(credentials.epoch)) {
        return { synced: false, rows: 0, reason: 'stale-session' };
      }
      this.status.markFailed(describe(error));
      await this.bus.publish([
        SyncEvents.failed(
          this.status.snapshot().target?.id ?? 'unknown',
          error instanceof SyncError ? error.code : 'INTERNAL',
        ),
      ]);
      return { synced: false, rows: 0, reason: 'failed' };
    }
  }

  /**
   * Toma de la cola lo que toca, en orden de llegada. Si se pidió un agregado concreto, **lo que no
   * encaja vuelve a la cola inmediatamente**: sincronizar solo las recetas no puede tirar por el
   * desagüe los insumos que estaban esperando su turno.
   */
  private async dequeue(aggregate: string | undefined): Promise<SyncItem[]> {
    const taken = await this.outbox.take();
    if (aggregate === undefined) {
      return taken;
    }
    await this.outbox.requeue(taken.filter((item) => item.aggregate !== aggregate));
    return taken.filter((item) => item.aggregate === aggregate);
  }

  /**
   * `true` si la sesión ya no es la que autorizó esta operación, en cuyo caso el resultado se tira.
   *
   * Dos formas de dejar de serlo. Si ya no hay credenciales (cerró sesión, o caducaron durante el
   * envío) el estado pasa a «sin conectar»: es lo único cierto que se puede decir, y evita que la
   * pantalla se quede colgada en «Sincronizando…». Si lo que hay es OTRA sesión, no se toca nada: el
   * estado pertenece ya a esa sesión y su propia sincronización lo pondrá al día.
   */
  private async sessionChanged(epoch: number): Promise<boolean> {
    const current = await this.credentials.current();
    if (current === null) {
      this.status.markDisconnected();
      return true;
    }
    return current.epoch !== epoch;
  }
}

/** Mensaje accionable para el usuario. Los del puerto ya vienen escritos para leerse. */
function describe(error: unknown): string {
  if (error instanceof SyncError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'La sincronización ha fallado por un motivo desconocido.';
}
