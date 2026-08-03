import { inject, Injectable } from '@angular/core';
import { EventBus } from '@core/_common/eventbus/event-bus';
import { IntegrationEventName } from '@core/_common/events/integration-events';
import { Logger } from '@core/_common/logger/logger';
import { Synchronize } from '../application/use-cases/synchronize.use-case';
import { SyncOutbox } from '../domain/services/sync-outbox';
import { SyncStatus } from '../domain/services/sync-status';

/** Identidad de este suscriptor ante el bus. Ver {@link EventBus.subscribe}. */
const SUBSCRIBER = 'external-sync:auth-changed';

/**
 * Adaptador de entrada hacia `auth`: traduce «ha entrado / ha salido una cuenta» a lo que eso
 * significa para la sincronización.
 *
 * **Al entrar** se tira la cola anterior (no pertenece a esta cuenta) y se empuja el recetario
 * COMPLETO. Ese envío completo no es un lujo: es lo que sube los datos sembrados y todo lo que el
 * usuario creó antes de tener cuenta —nada de eso pasó nunca por la cola— y lo que recupera los
 * cambios perdidos al recargar la página.
 *
 * **Al salir** se borra la cola y se reinicia el estado, así que no queda ni el enlace a la hoja de
 * la cuenta que se acaba de cerrar. Se escuchan los DOS eventos de salida: la sesión local se cierra
 * también cuando no se pudo retirar la autorización en el proveedor, y en ese caso hay que limpiar
 * igual.
 *
 * No espera a la red dentro del handler: entrar y salir responden al instante y el progreso se ve
 * en el estado.
 *
 * **CRÍTICO — solo reacciona a lo que pasa mientras vive.** El bus guarda los eventos y puede
 * repartirlos después de una recarga, si el proceso murió antes de terminar. Aquí eso sería dañino:
 * un `AuthenticationSucceeded` de la sesión anterior vaciaría la cola de sincronización al arrancar,
 * llevándose por delante cambios reales que esperaban su turno — y la sesión que lo publicó ya no
 * existe, porque vive solo en memoria (ver `InMemorySession`). Por eso se descarta todo evento
 * anterior al registro de este suscriptor. El bus reparte; interpretar si el evento sigue teniendo
 * sentido es cosa de quien lo escucha.
 */
@Injectable({ providedIn: 'root' })
export class AuthChangedSubscriber {
  private readonly bus = inject(EventBus);
  private readonly outbox = inject(SyncOutbox);
  private readonly status = inject(SyncStatus);
  private readonly sync = inject(Synchronize);
  private readonly log = inject(Logger).scoped('external-sync/on-auth-changed');

  /** Desde cuándo escucha. Todo lo anterior pertenece a una sesión que ya no existe. */
  private since = 0;

  register(): void {
    this.since = Date.now();

    this.bus.subscribe(SUBSCRIBER, IntegrationEventName.AUTHENTICATION_SUCCEEDED, async (event) => {
      if (this.isStale(event.occurredOn)) {
        this.log.debug('evento de una sesión anterior, se ignora', { event: event.name });
        return;
      }
      this.log.debug('cuenta conectada: se vacía la cola y se sincroniza todo');
      // Se espera al vaciado —no a la red— para que la cola de la cuenta anterior esté fuera del
      // disco ANTES de marcar conectado: si no, el envío completo podría arrastrarla.
      await this.outbox.clear();
      this.status.markConnected();
      this.sync
        .execute({ scope: 'all' })
        .catch((error: unknown) => this.log.error('Sincronización inicial fallida', error));
    });

    for (const eventName of [
      IntegrationEventName.SIGN_OUT_SUCCEEDED,
      IntegrationEventName.SIGN_OUT_FAILED,
    ]) {
      this.bus.subscribe(SUBSCRIBER, eventName, async (event) => {
        if (this.isStale(event.occurredOn)) {
          this.log.debug('evento de una sesión anterior, se ignora', { event: event.name });
          return;
        }
        await this.outbox.clear();
        this.status.markDisconnected();
        this.log.debug('cuenta desconectada: cola vaciada', { event: event.name });
      });
    }
  }

  /** `true` si el evento es de una sesión anterior a la de este suscriptor. */
  private isStale(occurredOn: Date): boolean {
    return occurredOn.getTime() < this.since;
  }
}
