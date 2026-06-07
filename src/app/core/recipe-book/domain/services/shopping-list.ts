import { Quantity } from '../../../_common/quantity';

export type ShoppingCategory = 'ingredient' | 'packaging' | 'topper';

/** One line of the shopping list — quantities only, no prices nor stock. */
export interface ShoppingListItem {
    readonly name: string;
    readonly totalQuantity: Quantity;
    readonly category: ShoppingCategory;
}

/**
 * Read model (CQRS projection) derived from a CakeComposition and its recipes.
 * Not an aggregate: no identity, no repository, materialized on demand.
 */
export interface ShoppingList {
    readonly items: readonly ShoppingListItem[];
}
