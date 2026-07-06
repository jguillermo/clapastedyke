import { DomainEvent, domainEvent } from '../../../_common/domain-event';

/**
 * Catálogo central de eventos de dominio del contexto recipe-book (§6.2).
 * Nombres en pasado y payloads mínimos de primitivos (Published Language).
 * Todos son fire-and-forget: se publican para el mundo (reacciones del chef,
 * contadores) y hoy no tienen suscriptor.
 *
 * Se usan desde los use cases, que los publican por el `EventBus` tras persistir,
 * mediante los factories de `RecipeBookEvents`.
 */
export const RecipeBookEventName = {
    SUPPLY_SAVED: 'SupplySaved',
    RECIPE_SAVED: 'RecipeSaved',
    RECIPE_CATEGORY_SAVED: 'RecipeCategorySaved',
    FLAVOR_SAVED: 'FlavorSaved',
    RECIPE_CAPACITY_SAVED: 'RecipeCapacitySaved',
} as const;

export const RecipeBookEvents = {
    supplySaved: (supplyId: string, isNew: boolean): DomainEvent =>
        domainEvent(RecipeBookEventName.SUPPLY_SAVED, supplyId, { isNew }),
    recipeSaved: (recipeId: string, isNew: boolean, categoryId: string): DomainEvent =>
        domainEvent(RecipeBookEventName.RECIPE_SAVED, recipeId, { isNew, categoryId }),
    recipeCategorySaved: (categoryId: string, isNew: boolean): DomainEvent =>
        domainEvent(RecipeBookEventName.RECIPE_CATEGORY_SAVED, categoryId, { isNew }),
    flavorSaved: (flavorId: string, isNew: boolean): DomainEvent =>
        domainEvent(RecipeBookEventName.FLAVOR_SAVED, flavorId, { isNew }),
    recipeCapacitySaved: (capacityId: string, isNew: boolean): DomainEvent =>
        domainEvent(RecipeBookEventName.RECIPE_CAPACITY_SAVED, capacityId, { isNew }),
};
