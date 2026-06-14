import { Quantity } from '../../../_common/quantity';

export type ShoppingCategory = 'ingredient' | 'packaging' | 'topper';

/**
 * One line of the shopping list. Carries the proportional **cost** in soles (a
 * live reference calc). No stock. Formatting to `'S/ …'` strings happens in the
 * use case (view DTO), not here.
 */
export interface ShoppingListItem {
    readonly name: string;
    readonly totalQuantity: Quantity;
    readonly cost: number;
    readonly category: ShoppingCategory;
}

/**
 * Read model (CQRS projection) derived from a CakeComposition and its recipes.
 * Not an aggregate: no identity, no repository, materialized on demand.
 */
export interface ShoppingList {
    readonly items: readonly ShoppingListItem[];
    readonly totalCost: number;
}
