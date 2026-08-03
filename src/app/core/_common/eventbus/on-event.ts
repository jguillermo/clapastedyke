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
  [SUBSCRIBED_TO]?: string;
}

/** Lo propio de la clase, sin heredar lo del padre. */
function own(useCase: Type<EventDrivenUseCase>): string | null {
  const decorated = useCase as Type<EventDrivenUseCase> & Decorated;
  return Object.hasOwn(decorated, SUBSCRIBED_TO) ? (decorated[SUBSCRIBED_TO] ?? null) : null;
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
 * **Un evento y solo uno por caso de uso.** No se apila: un caso de uso es *una* intención, y
 * escuchar dos hechos distintos con el mismo código obliga a ramificar por `event.name` dentro —que
 * es exactamente el `switch` que un caso de uso por evento evita—. Si dos eventos deben provocar lo
 * mismo, se escriben dos casos de uso que llamen a lo mismo. Decorar dos veces **lanza** al cargar el
 * módulo: en silencio, el segundo pisaría al primero y una suscripción desaparecería sin ruido.
 *
 * **El decorador solo anota, no suscribe.** Suscribir al importar el fichero haría que un caso de uso
 * que nadie inyecta —y que por tanto el bundler puede tirar— no llegara nunca a engancharse, y que el
 * orden de arranque dependiera del orden de los imports. El contexto declara los suyos en su
 * `provide*()` con `provideEventHandlers(...)`, que lee esta anotación.
 */
export function OnEvent(eventName: string) {
  return (useCase: Type<EventDrivenUseCase>): void => {
    const already = own(useCase);
    if (already) {
      throw new Error(
        `@OnEvent solo admite un evento por caso de uso: ${useCase.name} ya escucha "${already}" y se intentó añadir "${eventName}".`,
      );
    }
    Object.defineProperty(useCase, SUBSCRIBED_TO, { value: eventName, configurable: true });
  };
}

/** El evento que un caso de uso declaró con {@link OnEvent}, o `null` si no declaró ninguno. */
export function subscribedEventOf(useCase: Type<EventDrivenUseCase>): string | null {
  return own(useCase);
}
