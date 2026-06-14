/**
 * What an ingredient is used for. Everything bought to prepare the cake is an
 * `Ingredient`; `usage` is only a use tag (which slot it fills when composing
 * and how it groups in the shopping list) — it does NOT change how the
 * ingredient is bought or priced. There is no distinction in pricing.
 */
export type IngredientUsage = 'recipe' | 'topper' | 'box' | 'base';

export const INGREDIENT_USAGES: readonly IngredientUsage[] = ['recipe', 'topper', 'box', 'base'];

export function isIngredientUsage(value: string): value is IngredientUsage {
    return (INGREDIENT_USAGES as readonly string[]).includes(value);
}
