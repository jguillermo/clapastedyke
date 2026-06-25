import { Injectable } from '@angular/core';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { CakeComposition } from '../entities/cake-composition';
import { IngredientLine } from '../value-objects/ingredient-line';

/** A single ingredient need after scaling, aggregated across all recipes. */
export interface ScaledIngredient {
    readonly ingredientId: EntityId;
    readonly quantity: Quantity;
}

/** Una receta a escalar: sus líneas y su peso de referencia (en gramos). */
export interface ScalableRecipe {
    readonly lines: readonly IngredientLine[];
    readonly weight: Quantity;
}

export interface CakeScalingInput {
    composition: CakeComposition;
    recipes: ScalableRecipe[];
}

/**
 * Pure domain service (stateless): scales each recipe to the cake's target
 * weight (factor = targetWeight / pesoDeReferencia) and aggregates ingredient
 * needs by ingredientId. Es un servicio (no un método de la receta) porque
 * necesita varias recetas y el agregado no carga otros agregados.
 */
@Injectable({ providedIn: 'root' })
export class CakeScalingService {
    scale({ composition, recipes }: CakeScalingInput): ScaledIngredient[] {
        const totals = new Map<string, ScaledIngredient>();
        for (const recipe of recipes) {
            const factor = composition.targetWeight.ratioTo(recipe.weight);
            this.accumulate(totals, recipe.lines, factor);
        }
        return [...totals.values()];
    }

    private accumulate(
        totals: Map<string, ScaledIngredient>,
        lines: readonly IngredientLine[],
        factor: number,
    ): void {
        for (const line of lines) {
            const scaled = line.quantity.scaleBy(factor);
            const key = line.ingredientId.value;
            const existing = totals.get(key);
            totals.set(key, {
                ingredientId: line.ingredientId,
                quantity: existing ? existing.quantity.add(scaled) : scaled,
            });
        }
    }
}
