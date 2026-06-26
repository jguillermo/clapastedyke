import { DomainEvent, domainEvent } from '../../../_common/domain-event';
import { BaseUnit } from '../../../_common/quantity';

/**
 * Domain events of the recipe-book context (§6.2). Past-tense names, minimal
 * primitive payloads. `progression` only subscribes to `CakeComposed`; the
 * rest exist for the world (chef reactions, counters) and audit — e.g. the
 * `IngredientPriceRecorder` listens to `IngredientRepriced` to keep an
 * invisible price history.
 */
export const RecipeBookEventName = {
    INGREDIENT_SAVED: 'IngredientSaved',
    INGREDIENT_REPRICED: 'IngredientRepriced',
    RECIPE_SAVED: 'RecipeSaved',
    RECIPE_CATEGORY_SAVED: 'RecipeCategorySaved',
    PACKAGING_RULE_SAVED: 'PackagingRuleSaved',
    CAKE_COMPOSED: 'CakeComposed',
    SHOPPING_LIST_GENERATED: 'ShoppingListGenerated',
    FLAVOR_SAVED: 'FlavorSaved',
    CONVERSION_OPTION_SAVED: 'ConversionOptionSaved',
    RECIPE_SELECTED: 'RecipeSelected',
} as const;

/** Primitive shape of a purchase price carried by events (Published Language). */
export interface PurchasePricePrimitive {
    amount: number;
    per: { value: number; unit: BaseUnit };
}

export const RecipeBookEvents = {
    ingredientSaved: (ingredientId: string, isNew: boolean): DomainEvent =>
        domainEvent(RecipeBookEventName.INGREDIENT_SAVED, ingredientId, { isNew }),
    ingredientRepriced: (
        ingredientId: string,
        payload: { previousPrice: PurchasePricePrimitive | null; newPrice: PurchasePricePrimitive },
    ): DomainEvent => domainEvent(RecipeBookEventName.INGREDIENT_REPRICED, ingredientId, { ...payload }),
    recipeSaved: (recipeId: string, isNew: boolean, categoryId: string): DomainEvent =>
        domainEvent(RecipeBookEventName.RECIPE_SAVED, recipeId, { isNew, categoryId }),
    recipeCategorySaved: (categoryId: string, isNew: boolean): DomainEvent =>
        domainEvent(RecipeBookEventName.RECIPE_CATEGORY_SAVED, categoryId, { isNew }),
    packagingRuleSaved: (ruleId: string): DomainEvent =>
        domainEvent(RecipeBookEventName.PACKAGING_RULE_SAVED, ruleId),
    cakeComposed: (compositionId: string): DomainEvent =>
        domainEvent(RecipeBookEventName.CAKE_COMPOSED, compositionId),
    shoppingListGenerated: (compositionId: string, itemCount: number): DomainEvent =>
        domainEvent(RecipeBookEventName.SHOPPING_LIST_GENERATED, compositionId, { itemCount }),
    flavorSaved: (flavorId: string, isNew: boolean): DomainEvent =>
        domainEvent(RecipeBookEventName.FLAVOR_SAVED, flavorId, { isNew }),
    conversionOptionSaved: (optionId: string, isNew: boolean): DomainEvent =>
        domainEvent(RecipeBookEventName.CONVERSION_OPTION_SAVED, optionId, { isNew }),
    recipeSelected: (selectionId: string, recipeId: string): DomainEvent =>
        domainEvent(RecipeBookEventName.RECIPE_SELECTED, selectionId, { recipeId }),
};
