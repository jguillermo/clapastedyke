import { Type } from '@angular/core';
import { DomainEvent } from './domain-event';

/**
 * Un caso de uso que se dispara con un evento. Recibe el evento como petición: su `data`, más el
 * `aggregateId` de lo que cambió y la hora en que ocurrió.
 *
 * Se declara aquí, estructuralmente, y no se importa la clase base `UseCase`: así este paquete no
 * depende de nada del resto del proyecto. Cualquier `UseCase<DomainEvent, …>` encaja.
 */
export interface EventDrivenUseCase {
  execute(event: DomainEvent): Promise<unknown>;
}

/** Dónde el decorador deja lo declarado: en la propia clase, no en un registro global. */
const SUBSCRIBED_TO = Symbol('eventbus:subscribedTo');

interface Decorated {
  [SUBSCRIBED_TO]?: readonly string[];
}

/** Lo propio de la clase, sin heredar lo del padre. */
function own(useCase: Type<EventDrivenUseCase>): readonly string[] {
  const decorated = useCase as Type<EventDrivenUseCase> & Decorated;
  return Object.hasOwn(decorated, SUBSCRIBED_TO) ? (decorated[SUBSCRIBED_TO] ?? []) : [];
}

/**
 * Marca un caso de uso para que **se ejecute cuando llegue un evento**. Recibe el evento entero.
 *
 * ```typescript
 * @OnEvent(IntegrationEventName.RECIPE_SAVED)
 * @Injectable({ providedIn: 'root' })
 * export class QueueRecipeForSync extends UseCase<DomainEvent, void> {
 *   async execute(event: DomainEvent): Promise<void> {
 *     // event.aggregateId · event.data · event.occurredOn
 *   }
 * }
 * ```
 *
 * Se puede apilar para escuchar varios eventos con el mismo caso de uso.
 *
 * **El decorador solo anota, no suscribe.** Suscribir al importar el fichero haría que un caso de uso
 * que nadie inyecta —y que por tanto el bundler puede tirar— no llegara nunca a engancharse, y que el
 * orden de arranque dependiera del orden de los imports. El contexto declara los suyos en su
 * `provide*()` con `provideEventHandlers(...)`, que lee esta anotación.
 */
export function OnEvent(eventName: string) {
  return (useCase: Type<EventDrivenUseCase>): void => {
    Object.defineProperty(useCase, SUBSCRIBED_TO, {
      value: Object.freeze([...own(useCase), eventName]),
      configurable: true,
    });
  };
}

/** Los eventos que un caso de uso declaró con {@link OnEvent}. Vacío si no declaró ninguno. */
export function subscribedEventsOf(useCase: Type<EventDrivenUseCase>): readonly string[] {
  return own(useCase);
}
