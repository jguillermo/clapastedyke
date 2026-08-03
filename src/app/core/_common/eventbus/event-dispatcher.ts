import { inject, Injectable } from '@angular/core';
import { DomainEvent } from './domain-event';
import { EventHandler } from './event-bus';
import { Logger } from '../logger/logger';

/**
 * Enviar el evento a todos los suscriptores.
 *
 * Es la única pieza con lógica de verdad, y no toca la base de datos: recibe el evento y quién lo
 * tiene ya, y devuelve quién lo tiene después. Por eso se puede probar entera sin IndexedDB.
 *
 * Dos reglas:
 *
 * - **A nadie dos veces.** Quien ya lo recibió se salta. En un reintento solo se molesta a los que
 *   faltan.
 * - **Un suscriptor roto no arrastra a los demás.** Cada entrega va aislada; si una revienta, las
 *   otras se hacen igual y solo la fallida queda pendiente.
 */
@Injectable()
export class EventDispatcher {
  private readonly log = inject(Logger).scoped('eventbus/dispatcher');

  /** nombre de evento → (id de suscriptor → handler). */
  private readonly handlers = new Map<string, Map<string, EventHandler>>();

  subscribe(subscriber: string, eventName: string, handler: EventHandler): void {
    const forEvent = this.handlers.get(eventName) ?? new Map<string, EventHandler>();
    forEvent.set(subscriber, handler);
    this.handlers.set(eventName, forEvent);
    this.log.debug('suscrito', { subscriber, event: eventName });
  }

  /**
   * Entrega el evento a los suscriptores que aún no lo tienen.
   *
   * Devuelve `null` cuando llegó a **todos** (el evento ya se puede borrar), o la lista de quienes
   * lo tienen hasta ahora cuando alguno falló (para poder reintentar solo con el resto).
   */
  async deliver(event: DomainEvent, alreadyDelivered: readonly string[]): Promise<string[] | null> {
    const forEvent = this.handlers.get(event.name);

    // El caso que de otro modo es invisible: el evento se publicó, se encoló y se entregó A NADIE.
    // Desde fuera «no se publicó» y «no lo escucha nadie» se ven igual; esta línea los distingue.
    if (forEvent === undefined || forEvent.size === 0) {
      this.log.debug(`${event.name} no lo escucha nadie`, { aggregateId: event.aggregateId });
      return null;
    }

    const delivered = new Set(alreadyDelivered);
    let failed = false;

    for (const [subscriber, handler] of forEvent) {
      if (delivered.has(subscriber)) {
        continue;
      }
      try {
        await handler(event);
        delivered.add(subscriber);
        this.log.debug(`${event.name} → ${subscriber}`, { aggregateId: event.aggregateId });
      } catch (error) {
        failed = true;
        this.log.error(`El suscriptor ${subscriber} ha fallado con ${event.name}`, error, {
          aggregateId: event.aggregateId,
        });
      }
    }
    return failed ? [...delivered] : null;
  }
}
