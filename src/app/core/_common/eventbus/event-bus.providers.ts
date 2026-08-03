import {
  EnvironmentInjector,
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  Type,
} from '@angular/core';
import { EventBus } from './event-bus';
import { EventDatabase } from './event-database';
import { EventDispatcher } from './event-dispatcher';
import { EventReader } from './event-reader';
import { EventWriter } from './event-writer';
import { EventDrivenUseCase, subscribedEventOf } from './on-event';
import { PersistentEventBus } from './persistent-event-bus';
import { TraceEvents } from './trace-events.use-case';

/**
 * Enlaza el bus de eventos: su base de datos, quien escribe, quien lee, quien reparte, y el bus que
 * los encadena.
 *
 * El app-initializer arranca el repartidor. Que se registre aquí y no al final de todo da igual: el
 * repartidor nunca reparte de forma síncrona, así que el primer reparto cae después del arranque,
 * con todos los suscriptores ya registrados.
 */
export function provideEventBus(): EnvironmentProviders {
  return makeEnvironmentProviders([
    EventDatabase,
    EventWriter,
    EventReader,
    EventDispatcher,
    PersistentEventBus,
    { provide: EventBus, useExisting: PersistentEventBus },
    provideAppInitializer(() => inject(PersistentEventBus).start()),
  ]);
}

/**
 * Engancha el trazador: **deja en consola todos los eventos** del Published Language según se
 * reparten. Es una herramienta de diagnóstico, no parte del funcionamiento; se declara aparte de
 * `provideEventBus()` justamente para que apagarla sea quitar una línea de `app.config.ts`.
 *
 * No pasa por `provideEventHandlers`: eso lee `@OnEvent`, que declara **un** evento por caso de uso.
 * El trazador no reacciona a un hecho concreto, escucha el catálogo entero, así que se suscribe a
 * mano — una vez por nombre, con el mismo id de suscriptor.
 */
export function provideEventTracing(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const dispatcher = inject(EventDispatcher);
      const injector = inject(EnvironmentInjector);

      for (const eventName of TraceEvents.traced) {
        dispatcher.subscribe(TraceEvents.name, eventName, async (event) => {
          await injector.get(TraceEvents).execute(event);
        });
      }
    }),
  ]);
}

/**
 * Engancha al bus los casos de uso que declararon `@OnEvent(...)`. Va en el `provide*()` del
 * contexto que los posee, junto al resto de sus bindings.
 *
 * ```typescript
 * export function provideRecipeBook(): EnvironmentProviders {
 *   return makeEnvironmentProviders([
 *     …,
 *     provideEventHandlers(QueueRecipeForSync, RewardTheChef),
 *   ]);
 * }
 * ```
 *
 * **El caso de uso se construye cuando llega su primer evento**, no al arrancar: aquí solo se
 * registra la suscripción, que es gratis. Si el evento no llega nunca, el caso de uso no se
 * instancia nunca.
 *
 * La identidad ante el bus —la clave con la que se anota quién ya recibió cada evento— es el nombre
 * de la clase. No chocan entre sí: el bundler obliga a que los identificadores de nivel superior sean
 * únicos dentro de un bundle, así que dos clases que en el fuente se llamen igual salen con nombres
 * distintos.
 */
export function provideEventHandlers(
  ...useCases: readonly Type<EventDrivenUseCase>[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const dispatcher = inject(EventDispatcher);
      const injector = inject(EnvironmentInjector);

      for (const useCase of useCases) {
        // Sin `@OnEvent` no hay nada que enganchar, y eso no es un error: simplemente no se
        // suscribe a nada.
        const eventName = subscribedEventOf(useCase);
        if (!eventName) {
          continue;
        }
        // Se espera al caso de uso: si lanza, el bus lo cuenta como entrega fallida y lo
        // reintentará. Descartar la promesa aquí rompería esa garantía.
        dispatcher.subscribe(useCase.name, eventName, async (event) => {
          await injector.get(useCase).execute(event);
        });
      }
    }),
  ]);
}
