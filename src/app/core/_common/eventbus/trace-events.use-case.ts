import { inject, Injectable } from '@angular/core';
import { DomainEvent } from './domain-event';
import { IntegrationEventName } from '../events/integration-events';
import { Logger } from '../logger/logger';

/**
 * **Diagnóstico: deja rastro de TODOS los eventos que reparte el bus.**
 *
 * Existe porque un evento sin suscriptor es invisible: se publica, se encola y se entrega a nadie,
 * y desde fuera no hay forma de distinguir «no se publicó» de «no lo escucha nadie». Con esto,
 * cualquier hecho del sistema queda registrado en cuanto ocurre.
 *
 * Registra en nivel **debug**, así que se ve con el modo depuración encendido (`migoLog.on()` en la
 * consola del navegador); ver {@link Logger}.
 *
 * **No lleva `@OnEvent`**, y no es un descuido: ese decorador declara *el* evento al que reacciona un
 * caso de uso, uno y solo uno. Esto no reacciona a un hecho concreto — escucha el Published Language
 * entero—, así que se engancha a mano en {@link provideEventTracing}, sobre
 * `Object.values(IntegrationEventName)` y no sobre una lista escrita a mano: **un nombre nuevo en el
 * catálogo queda trazado solo**. Cada evento llega una única vez (tiene un solo nombre), y el reparto
 * es posterior al guardado, así que trazar no le cuesta nada a quien pulsó Guardar.
 *
 * No es de ningún contexto: el catálogo que traza vive en el shared kernel. Quitar
 * `provideEventTracing()` de `app.config.ts` lo apaga del todo.
 */
@Injectable({ providedIn: 'root' })
export class TraceEvents {
  /** Todos los nombres del Published Language: escuchar la lista entera es el objetivo. */
  static readonly traced: readonly string[] = Object.values(IntegrationEventName);

  private readonly log = inject(Logger).scoped('events');

  async execute(event: DomainEvent): Promise<void> {
    this.log.debug(event.name, {
      aggregateId: event.aggregateId,
      occurredOn: event.occurredOn.toISOString(),
      data: event.data,
    });
  }
}
