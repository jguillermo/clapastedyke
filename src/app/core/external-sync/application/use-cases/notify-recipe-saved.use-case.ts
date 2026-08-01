import { Injectable } from '@angular/core';
import { DomainEvent } from '@core/_common/eventbus/domain-event';
import { OnEvent } from '@core/_common/eventbus/on-event';
import { IntegrationEventName } from '@core/_common/events/integration-events';
import { UseCase } from '@core/_common/use-case';

/**
 * Deja constancia de que se guardó una receta ahí fuera. **Un solo evento**: no distingue el alta de
 * la edición porque quien publica tampoco lo hace — persistir es persistir.
 *
 * **Se dispara solo**: no lo llama ninguna pantalla. El bus le entrega el evento y el contexto lo
 * engancha con `provideEventHandlers(...)` en su `provide*()`; la clase no se construye hasta que
 * llega el primer `RecipeSaved`.
 *
 * **Corre FUERA del guardado.** El bus encola al publicar y reparte después, en su propio turno, así
 * que lo que se haga aquí no le cuesta un milisegundo a quien pulsó «Guardar» — este es el sitio
 * donde entra una actualización remota, que tarda lo que tarde internet. Hoy solo escribe en consola.
 *
 * Si esto lanza, el bus lo cuenta como entrega fallida y **lo reintenta** (entrega al menos una vez
 * por suscriptor), incluso después de una recarga. Lo que se haga aquí tiene que aguantar repetirse.
 *
 * No conoce al recetario: solo el nombre del evento, que vive en el shared kernel.
 */
@OnEvent(IntegrationEventName.RECIPE_SAVED)
@Injectable({ providedIn: 'root' })
export class NotifyRecipeSaved extends UseCase<DomainEvent, void> {
  async execute(event: DomainEvent): Promise<void> {
    // eslint-disable-next-line no-console -- traza provisional: el sitio donde irá el envío remoto.
    console.log('[external-sync] Receta guardada', {
      recipeId: event.aggregateId,
      categoryId: event.data['categoryId'],
      occurredOn: event.occurredOn.toISOString(),
    });
  }
}
