import { Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { BaseUnit, Quantity } from '../../../_common/quantity';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { formatPerBaseUnit, formatReference, formatSoles } from '../money';

export interface PreviewIngredientCostRequest {
    /** How the ingredient is bought (presentation + price), normalised to base unit. */
    purchasePrice: { amount: number; per: { value: number; unit: BaseUnit } };
    /** The quantity the recipe line uses (same base unit as `per`). */
    quantity?: { value: number; unit: BaseUnit };
}

export interface PreviewIngredientCostResult {
    /** Proportional cost of `quantity`, ready to paint (empty if no quantity yet). */
    cost: string;
    /** Cost per base unit, e.g. `'S/ 0.0050 / g'`. */
    perBaseUnitLabel: string;
    /** Ghost reference of how it is bought, e.g. `'1 kg · S/ 5'`. */
    reference: string;
}

/**
 * Live reference calculation (no persistence): given how an ingredient is
 * bought and the line quantity, returns the proportional cost, the cost per
 * base unit and the ghost reference — all **formatted, ready to paint**, so the
 * view never computes nor formats (memoria `calculos-solo-en-negocio`).
 */
@Injectable({ providedIn: 'root' })
export class PreviewIngredientCost extends UseCase<PreviewIngredientCostRequest, PreviewIngredientCostResult> {
    async execute({ purchasePrice, quantity }: PreviewIngredientCostRequest): Promise<PreviewIngredientCostResult> {
        const price = PurchasePrice.of(purchasePrice.amount, Quantity.of(purchasePrice.per.value, purchasePrice.per.unit));

        let cost = '';
        if (quantity && quantity.value > 0 && quantity.unit === price.per.unit) {
            cost = formatSoles(price.costFor(Quantity.of(quantity.value, quantity.unit)));
        }

        return { cost, perBaseUnitLabel: formatPerBaseUnit(price), reference: formatReference(price) };
    }
}
