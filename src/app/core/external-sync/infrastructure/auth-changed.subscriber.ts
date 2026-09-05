import { inject, Injectable } from '@angular/core';
import { EventBus } from '@core/_common/eventbus/event-bus';
import { IntegrationEventName } from '@core/_common/events/integration-events';
import { Logger } from '@core/_common/logger/logger';
import { SyncShadow } from '../domain/services/sync-shadow';
import { SyncOutbox } from '../domain/services/sync-outbox';
import { SyncScheduler } from './sync-scheduler';
import { SyncStatus } from '../domain/services/sync-status';

/** Identidad de este suscriptor ante el bus. Ver {@link EventBus.subscribe}. */
const SUBSCRIBER = 'external-sync:auth-changed';

/**
 * Adaptador de entrada hacia `auth`: traduce «ha entrado / ha salido una cuenta» a lo que eso
 * significa para la sincronización.
 *
 * **Al entrar** se tira la cola anterior (no pertenece a esta cuenta) y se empuja el recetario
 * COMPLETO. **Al reanudar** —la misma cuenta que vuelve tras una recarga— NO se tira nada: la cola es
 * suya y solo se empuja lo que hubiera pendiente.
 *
 * Ese envío completo no es un lujo: es lo que sube los datos sembrados y todo lo que el usuario creó
 * antes de tener cuenta — nada de eso pasó nunca por la cola.
 *
 * **Al salir** se borra la cola y se reinicia el estado, así que no queda ni el enlace a la hoja de
 * la cuenta que se acaba de cerrar. Hay un solo evento de salida porque salir tiene un solo final:
 * `SignOut` se niega a cerrar en local lo que no ha podido cerrar en el servicio de sesión.
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
  private readonly shadow = inject(SyncShadow);
  private readonly status = inject(SyncStatus);
  private readonly scheduler = inject(SyncScheduler);
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
      this.log.debug('cuenta conectada: se olvida lo de la cuenta anterior y se sincroniza');
      // Se espera al vaciado —no a la red— para que lo de la cuenta anterior esté fuera del disco
      // ANTES de marcar conectado: si no, el primer ciclo podría arrastrarlo.
      //
      // **La base se vacía igual que la cola, y es imprescindible.** La base dice «esto es lo que había
      // en la hoja»; si sobreviviera de otra cuenta, las filas de la hoja nueva se compararían contra
      // una base que no es la suya y parecerían cambios remotos que no existen.
      await this.outbox.clear();
      await this.shadow.clear();
      this.status.markConnected();
      this.scheduler.syncNow('cuenta conectada');
    });

    // Volver no es entrar. La cuenta es la misma, así que lo que quedó en la cola antes de recargar
    // es SUYO: vaciarla aquí borraría cambios reales. Solo se marca conectado y se empuja lo que
    // estuviera esperando — que es justo lo que una recarga interrumpió.
    this.bus.subscribe(SUBSCRIBER, IntegrationEventName.SESSION_RESUMED, async (event) => {
      if (this.isStale(event.occurredOn)) {
        this.log.debug('evento de una sesión anterior, se ignora', { event: event.name });
        return;
      }
      this.log.debug('sesión reanudada: se conserva lo pendiente y se sincroniza');
      this.status.markConnected();
      this.scheduler.syncNow('sesión reanudada');
    });

    this.bus.subscribe(SUBSCRIBER, IntegrationEventName.SIGN_OUT_SUCCEEDED, async (event) => {
      if (this.isStale(event.occurredOn)) {
        this.log.debug('evento de una sesión anterior, se ignora', { event: event.name });
        return;
      }
      // Al salir se olvidan las dos cosas por cuenta: lo pendiente y la base de comparación.
      await this.outbox.clear();
      await this.shadow.clear();
      this.status.markDisconnected();
      this.log.debug('cuenta desconectada: cola y base vaciadas');
    });
  }

  /** `true` si el evento es de una sesión anterior a la de este suscriptor. */
  private isStale(occurredOn: Date): boolean {
    return occurredOn.getTime() < this.since;
  }
}
