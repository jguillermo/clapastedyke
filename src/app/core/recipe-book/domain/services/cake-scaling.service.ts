import { Injectable } from '@angular/core';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { CakeComposition } from '../entities/cake-composition';
import { SpongeRecipe } from '../entities/sponge-recipe';
import { FillingRecipe } from '../entities/filling-recipe';
import { CoveringRecipe } from '../entities/covering-recipe';
import { IngredientLine } from '../value-objects/ingredient-line';

/** A single ingredient need after scaling, aggregated across all recipes. */
export interface ScaledIngredient {
    readonly ingredientId: EntityId;
    readonly quantity: Quantity;
}

export interface CakeScalingInput {
    composition: CakeComposition;
    sponge: SpongeRecipe;
    filling: FillingRecipe;
    covering: CoveringRecipe;
}

/**
 * Pure domain service (stateless): scales the three recipes to the cake's
 * target weight and aggregates ingredient needs by ingredientId. It is a
 * service — not a method of CakeComposition — because it needs the sponge,
 * filling and covering loaded, and an aggregate must not load other aggregates.
 */
@Injectable({ providedIn: 'root' })
export class CakeScalingService {
    scale({ composition, sponge, filling, covering }: CakeScalingInput): ScaledIngredient[] {
        const factorSponge = composition.targetWeight.ratioTo(sponge.referenceYield.weight);
        const factorFilling = composition.targetWeight.ratioTo(filling.referenceWeight);
        const factorCovering = composition.targetWeight.ratioTo(covering.referenceWeight);

        const totals = new Map<string, ScaledIngredient>();
        this.accumulate(totals, sponge.lines, factorSponge);
        this.accumulate(totals, filling.lines, factorFilling);
        this.accumulate(totals, covering.lines, factorCovering);

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
