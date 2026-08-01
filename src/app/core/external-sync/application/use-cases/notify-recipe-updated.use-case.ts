import { Injectable } from '@angular/core';
import { DomainEvent } from '@core/_common/eventbus/domain-event';
import { OnEvent } from '@core/_common/eventbus/on-event';
import { IntegrationEventName } from '@core/_common/events/integration-events';
import { UseCase } from '@core/_common/use-case';

/**
 * Deja constancia de que se editó una receta ya existente.
 *
 * Va aparte de {@link import('./notify-recipe-created.use-case').NotifyRecipeCreated} porque son dos
 * hechos distintos: uno estrena receta y el otro toca una que ya estaba. Quien solo necesite «la
 * receta cambió, da igual cómo» se engancha a `RecipeSaved` y se ahorra la distinción.
 *
 * Como el resto de reacciones del bus, corre **fuera** del guardado y se reintenta si falla. Hoy solo
 * escribe en consola; aquí es donde entrará la actualización remota asíncrona.
 */
@OnEvent(IntegrationEventName.RECIPE_UPDATED)
@Injectable({ providedIn: 'root' })
export class NotifyRecipeUpdated extends UseCase<DomainEvent, void> {
  async execute(event: DomainEvent): Promise<void> {
    // eslint-disable-next-line no-console -- traza provisional: el sitio donde irá el envío remoto.
    console.log(event);
    console.log('[external-sync] Receta editada', {
      recipeId: event.aggregateId,
      categoryId: event.data['categoryId'],
      occurredOn: event.occurredOn.toISOString(),
    });
  }
}
