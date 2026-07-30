import { Quantity } from '../../_common/quantity';
import { PurchasePrice, symbolFor } from '../domain/value-objects/purchase-price';

/** A partir de estos gramos, una masa se muestra en kilos (1000 g → "1 kg"). */
const KG_THRESHOLD = 1000;

/** Formatea un importe monetario listo para pintar: `'S/ 1.50'`. La vista nunca formatea. */
export function formatSoles(amount: number, currency = 'PEN'): string {
  return `${symbolFor(currency)} ${amount.toFixed(2)}`;
}

/** Formatea una cantidad en una unidad legible para humanos: `'1 kg'`, `'300 g'`, `'4 u'`. */
export function formatMeasure(quantity: Quantity): string {
  if (quantity.unit === 'u') {
    return `${trim(quantity.value)} u`;
  }
  return quantity.value >= KG_THRESHOLD
    ? `${trim(quantity.value / 1000)} kg`
    : `${trim(quantity.value)} g`;
}

/** La referencia "fantasma" de compra: `'1 kg · S/ 5'`. */
export function formatReference(price: PurchasePrice): string {
  return `${formatMeasure(price.per)} · ${symbolFor(price.currency)} ${trim(price.amount)}`;
}

/** Costo por unidad base, listo para pintar: `'S/ 0.0050 por g'`. */
export function formatPerBaseUnit(price: PurchasePrice): string {
  return `${symbolFor(price.currency)} ${price.perBaseUnit().toFixed(4)} por ${price.per.unit}`;
}

/** Elimina los ceros finales de un número para mostrarlo (5.00 → "5", 1.50 → "1.5"). */
function trim(value: number): string {
  return String(Number(value.toFixed(4)));
}
