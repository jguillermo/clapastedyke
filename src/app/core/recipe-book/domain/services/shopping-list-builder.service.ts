import { Injectable } from '@angular/core';
import { Quantity } from '../../../_common/quantity';
import { Ingredient } from '../entities/ingredient';
import { IngredientUsage } from '../value-objects/ingredient-usage';
import { ScaledIngredient } from './cake-scaling.service';
import { ShoppingCategory, ShoppingList, ShoppingListItem } from './shopping-list';

export interface ShoppingListInput {
    scaled: readonly ScaledIngredient[];
    /** All ingredients needed to resolve the scaled lines (recipe insumos). */
    ingredients: readonly Ingredient[];
    /** Box and base ingredients (usage box/base) resolved by the packaging rule. */
    box: Ingredient;
    base: Ingredient;
    /** Optional topper ingredient (usage topper). */
    topper?: Ingredient;
}

/**
 * Pure domain service (stateless): projects the ShoppingList read model. Every
 * line is an Ingredient with its purchase price, so the cost is the proportional
 * (rule of three) `purchasePrice.costFor(qty)`; recipe lines use the scaled
 * quantity, topper/box/base use 1 unit. `totalCost` sums them all. Cost in soles
 * (numbers); the use case formats for the view.
 */
@Injectable({ providedIn: 'root' })
export class ShoppingListBuilder {
    private static readonly ONE_UNIT = Quantity.of(1, 'u');

    build({ scaled, ingredients, box, base, topper }: ShoppingListInput): ShoppingList {
        const byId = new Map(ingredients.map((i) => [i.id.value, i]));

        const ingredientItems: ShoppingListItem[] = scaled.map((s) => {
            const ingredient = byId.get(s.ingredientId.value);
            return this.itemFor(ingredient, s.ingredientId.value, s.quantity);
        });

        const countItems: ShoppingListItem[] = [box, base, ...(topper ? [topper] : [])].map((ingredient) =>
            this.itemFor(ingredient, ingredient.id.value, ShoppingListBuilder.ONE_UNIT),
        );

        const items = [...ingredientItems, ...countItems];
        const totalCost = items.reduce((sum, item) => sum + item.cost, 0);
        return { items, totalCost };
    }

    private itemFor(ingredient: Ingredient | undefined, fallbackName: string, quantity: Quantity): ShoppingListItem {
        if (!ingredient) {
            return { name: fallbackName, totalQuantity: quantity, cost: 0, category: 'ingredient' };
        }
        return {
            name: ingredient.name,
            totalQuantity: quantity,
            cost: ingredient.purchasePrice.costFor(quantity),
            category: categoryOf(ingredient.usage),
        };
    }
}

function categoryOf(usage: IngredientUsage): ShoppingCategory {
    if (usage === 'topper') return 'topper';
    if (usage === 'box' || usage === 'base') return 'packaging';
    return 'ingredient';
}
