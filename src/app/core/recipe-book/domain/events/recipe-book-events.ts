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
/** Qué cambió en un insumo al editarlo. Ambos pueden ser `true` en el mismo guardado. */
export interface SupplyChanges {
  renamed: boolean;
  repriced: boolean;
}

export const RecipeBookEvents = {
  supplySaved: (supplyId: string, isNew: boolean): DomainEvent =>
    domainEvent(IntegrationEventName.SUPPLY_SAVED, supplyId, { isNew }),
  recipeSaved: (recipeId: string, isNew: boolean, categoryId: string): DomainEvent =>
    domainEvent(IntegrationEventName.RECIPE_SAVED, recipeId, { isNew, categoryId }),

  /**
   * El alta y la edición como hechos distintos, para quien reacciona distinto a cada uno.
   *
   * Van **además** de `supplySaved`/`recipeSaved`, no en su lugar: quien solo necesita saber que el
   * dato cambió (la sincronización) sigue escuchando el genérico y no se entera de esta distinción.
   * Por eso un guardado publica los dos eventos en la misma llamada a `publish`.
   *
   * El payload sigue siendo mínimo: `isNew` sobra —lo dice el nombre— y de la edición solo se
   * cuenta **qué** cambió, nunca a qué valor. Quien quiera el dato lo pide por un contrato del
   * shared kernel.
   */
  supplyCreated: (supplyId: string, name: string): DomainEvent =>
    domainEvent(IntegrationEventName.SUPPLY_CREATED, supplyId, { name }),
  supplyUpdated: (supplyId: string, changes: SupplyChanges): DomainEvent =>
    domainEvent(IntegrationEventName.SUPPLY_UPDATED, supplyId, { ...changes }),
  recipeCreated: (recipeId: string, categoryId: string): DomainEvent =>
    domainEvent(IntegrationEventName.RECIPE_CREATED, recipeId, { categoryId }),
  recipeUpdated: (recipeId: string, categoryId: string): DomainEvent =>
    domainEvent(IntegrationEventName.RECIPE_UPDATED, recipeId, { categoryId }),
  recipeCategorySaved: (categoryId: string, isNew: boolean): DomainEvent =>
    domainEvent(IntegrationEventName.RECIPE_CATEGORY_SAVED, categoryId, { isNew }),
  flavorSaved: (flavorId: string, isNew: boolean): DomainEvent =>
    domainEvent(IntegrationEventName.FLAVOR_SAVED, flavorId, { isNew }),
  recipeCapacitySaved: (capacityId: string, isNew: boolean): DomainEvent =>
    domainEvent(IntegrationEventName.RECIPE_CAPACITY_SAVED, capacityId, { isNew }),
};
