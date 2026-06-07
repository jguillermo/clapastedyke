import { Injectable } from '@angular/core';
import { Quantity } from '../../../_common/quantity';
import { Ingredient } from '../entities/ingredient';
import { PackagingItem } from '../entities/packaging-item';
import { Topper } from '../entities/topper';
import { ScaledIngredient } from './cake-scaling.service';
import { ShoppingList, ShoppingListItem } from './shopping-list';

export interface ShoppingListInput {
    scaled: readonly ScaledIngredient[];
    ingredients: readonly Ingredient[];
    box: PackagingItem;
    base: PackagingItem;
    topper?: Topper;
}

/**
 * Pure domain service (stateless): projects the ShoppingList read model from
 * the scaled ingredients plus the loaded ingredient/packaging/topper aggregates
 * (needed to resolve names). Quantities only — no prices nor stock.
 */
@Injectable({ providedIn: 'root' })
export class ShoppingListBuilder {
    private static readonly ONE_UNIT = Quantity.of(1, 'u');

    build({ scaled, ingredients, box, base, topper }: ShoppingListInput): ShoppingList {
        const namesById = new Map(ingredients.map((i) => [i.id.value, i.name]));

        const ingredientItems: ShoppingListItem[] = scaled.map((s) => ({
            name: namesById.get(s.ingredientId.value) ?? s.ingredientId.value,
            totalQuantity: s.quantity,
            category: 'ingredient',
        }));

        const packagingItems: ShoppingListItem[] = [box, base].map((item) => ({
            name: item.name,
            totalQuantity: ShoppingListBuilder.ONE_UNIT,
            category: 'packaging',
        }));

        const items: ShoppingListItem[] = [...ingredientItems, ...packagingItems];
        if (topper) {
            items.push({ name: topper.name, totalQuantity: ShoppingListBuilder.ONE_UNIT, category: 'topper' });
        }

        return { items };
    }
}
