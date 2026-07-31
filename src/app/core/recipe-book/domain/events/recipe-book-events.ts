import { DomainEvent, domainEvent } from '@core/_common/eventbus/domain-event';
import { IntegrationEventName } from '@core/_common/events/integration-events';

/**
 * Catálogo de eventos de dominio del contexto recipe-book (§6.2). Nombres en pasado y payloads
 * mínimos de primitivos (Published Language).
 *
 * Se publican desde los **casos de uso**, por el `EventBus`, después de persistir el agregado. El
 * `aggregateId` es el id del agregado que cambió, y el nombre del agregado es el que declara
 * `RECIPE_BOOK_AGGREGATES`, así que un suscriptor puede pedir esos datos sin conocer este contexto.
 *
 * Los nombres viven en el shared kernel porque **cruzan la frontera**: quien se suscribe no puede
 * importar de aquí (ver `core-conventions.md` → «Los contextos no se conocen»).
 */
export const RecipeBookEvents = {
  supplySaved: (supplyId: string, isNew: boolean): DomainEvent =>
    domainEvent(IntegrationEventName.SUPPLY_SAVED, supplyId, { isNew }),
  recipeSaved: (recipeId: string, isNew: boolean, categoryId: string): DomainEvent =>
    domainEvent(IntegrationEventName.RECIPE_SAVED, recipeId, { isNew, categoryId }),
  recipeCategorySaved: (categoryId: string, isNew: boolean): DomainEvent =>
    domainEvent(IntegrationEventName.RECIPE_CATEGORY_SAVED, categoryId, { isNew }),
  flavorSaved: (flavorId: string, isNew: boolean): DomainEvent =>
    domainEvent(IntegrationEventName.FLAVOR_SAVED, flavorId, { isNew }),
  recipeCapacitySaved: (capacityId: string, isNew: boolean): DomainEvent =>
    domainEvent(IntegrationEventName.RECIPE_CAPACITY_SAVED, capacityId, { isNew }),
};
