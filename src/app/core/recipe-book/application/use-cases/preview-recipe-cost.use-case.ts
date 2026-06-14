import { Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { BaseUnit, Quantity } from '../../../_common/quantity';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { formatSoles } from '../money';

export interface PreviewRecipeCostLine {
    purchasePrice: { amount: number; per: { value: number; unit: BaseUnit } } | null;
    quantity?: { value: number; unit: BaseUnit };
}

export interface PreviewRecipeCostRequest {
    lines: PreviewRecipeCostLine[];
}

export interface PreviewRecipeCostResult {
    /** Per-line proportional cost, formatted (`'S/ 1.50'`), aligned to the input order. */
    items: { cost: string }[];
    /** Materials total of the priced lines, formatted (`'S/ 4.00'`). */
    total: string;
}

/**
 * Live reference calculation: the proportional cost of each recipe line and the
 * **materials total**, all formatted ready to paint (memoria
 * `calculos-solo-en-negocio`). A line with no price/quantity (or mismatched
 * unit) contributes an empty cost and is excluded from the total.
 */
@Injectable({ providedIn: 'root' })
export class PreviewRecipeCost extends UseCase<PreviewRecipeCostRequest, PreviewRecipeCostResult> {
    async execute({ lines }: PreviewRecipeCostRequest): Promise<PreviewRecipeCostResult> {
        let total = 0;
        const items = lines.map((line) => {
            const cost = this.lineCost(line);
            if (cost !== null) {
                total += cost;
            }
            return { cost: cost === null ? '' : formatSoles(cost) };
        });
        return { items, total: formatSoles(total) };
    }

    private lineCost(line: PreviewRecipeCostLine): number | null {
        const { purchasePrice, quantity } = line;
        if (!purchasePrice || !quantity || quantity.value <= 0 || quantity.unit !== purchasePrice.per.unit) {
            return null;
        }
        const price = PurchasePrice.of(purchasePrice.amount, Quantity.of(purchasePrice.per.value, purchasePrice.per.unit));
        return price.costFor(Quantity.of(quantity.value, quantity.unit));
    }
}
