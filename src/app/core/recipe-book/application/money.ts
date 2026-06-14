import { Quantity } from '../../_common/quantity';
import { PurchasePrice } from '../domain/value-objects/purchase-price';

/** Below this many grams, show a mass as kilos (1000 g → "1 kg"). */
const KG_THRESHOLD = 1000;

/** Formats soles ready to paint: `'S/ 1.50'`. The view never formats. */
export function formatSoles(amount: number): string {
    return `S/ ${amount.toFixed(2)}`;
}

/** Formats a quantity in a human-friendly unit: `'1 kg'`, `'300 g'`, `'4 u'`. */
export function formatMeasure(quantity: Quantity): string {
    if (quantity.unit === 'u') {
        return `${trim(quantity.value)} u`;
    }
    return quantity.value >= KG_THRESHOLD ? `${trim(quantity.value / 1000)} kg` : `${trim(quantity.value)} g`;
}

/** The "ghost" purchase reference: `'1 kg · S/ 5'`. */
export function formatReference(price: PurchasePrice): string {
    return `${formatMeasure(price.per)} · S/ ${trim(price.amount)}`;
}

/** Cost per base unit, ready to paint: `'S/ 0.0050 por g'`. */
export function formatPerBaseUnit(price: PurchasePrice): string {
    return `S/ ${price.perBaseUnit().toFixed(4)} por ${price.per.unit}`;
}

/** Drops trailing zeros from a number for display (5.00 → "5", 1.50 → "1.5"). */
function trim(value: number): string {
    return String(Number(value.toFixed(4)));
}
