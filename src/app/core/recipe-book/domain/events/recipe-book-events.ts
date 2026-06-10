import { DomainEvent, domainEvent } from '../../../_common/domain-event';

/**
 * Domain events of the recipe-book context (§6.2). Past-tense names, minimal
 * primitive payloads. `progression` only subscribes to `CakeComposed`; the
 * rest exist for the world (chef reactions, counters) and audit.
 */
export const RecipeBookEventName = {
    INGREDIENT_SAVED: 'IngredientSaved',
    SPONGE_RECIPE_SAVED: 'SpongeRecipeSaved',
    FILLING_RECIPE_SAVED: 'FillingRecipeSaved',
    COVERING_RECIPE_SAVED: 'CoveringRecipeSaved',
    TOPPER_SAVED: 'TopperSaved',
    PACKAGING_ITEM_SAVED: 'PackagingItemSaved',
    PACKAGING_RULE_SAVED: 'PackagingRuleSaved',
    CAKE_COMPOSED: 'CakeComposed',
    SHOPPING_LIST_GENERATED: 'ShoppingListGenerated',
} as const;

export const RecipeBookEvents = {
    ingredientSaved: (ingredientId: string, isNew: boolean): DomainEvent =>
        domainEvent(RecipeBookEventName.INGREDIENT_SAVED, ingredientId, { isNew }),
    spongeRecipeSaved: (recipeId: string, isNew: boolean): DomainEvent =>
        domainEvent(RecipeBookEventName.SPONGE_RECIPE_SAVED, recipeId, { isNew }),
    fillingRecipeSaved: (recipeId: string, isNew: boolean): DomainEvent =>
        domainEvent(RecipeBookEventName.FILLING_RECIPE_SAVED, recipeId, { isNew }),
    coveringRecipeSaved: (recipeId: string, isNew: boolean): DomainEvent =>
        domainEvent(RecipeBookEventName.COVERING_RECIPE_SAVED, recipeId, { isNew }),
    topperSaved: (topperId: string, isNew: boolean): DomainEvent =>
        domainEvent(RecipeBookEventName.TOPPER_SAVED, topperId, { isNew }),
    packagingItemSaved: (itemId: string, isNew: boolean): DomainEvent =>
        domainEvent(RecipeBookEventName.PACKAGING_ITEM_SAVED, itemId, { isNew }),
    packagingRuleSaved: (ruleId: string): DomainEvent =>
        domainEvent(RecipeBookEventName.PACKAGING_RULE_SAVED, ruleId),
    cakeComposed: (compositionId: string): DomainEvent =>
        domainEvent(RecipeBookEventName.CAKE_COMPOSED, compositionId),
    shoppingListGenerated: (compositionId: string, itemCount: number): DomainEvent =>
        domainEvent(RecipeBookEventName.SHOPPING_LIST_GENERATED, compositionId, { itemCount }),
};
