import { Quantity } from '../../../_common/quantity';

/**
 * Precio de compra de un insumo — un value object *todo conceptual*
 * (identidad por valor, inmutable). Modela **cómo lo compra Ariana**: la
 * presentación que compra (`per`, p. ej. 1000 g o 30 u), cuánto cuesta esa
 * compra (`amount`) y en qué **moneda** (`currency`, ISO 4217). Es un costo de
 * compra, nunca un precio de venta. Lo guarda cada Supply y se apoya en
 * Quantity para la presentación.
 *
 * El comportamiento es sin efectos secundarios y devuelve valores:
 * - {@link perBaseUnit} — costo por unidad base (el "precio por gramo/unidad"),
 *   un cálculo de referencia vivo.
 * - {@link costFor} — regla de tres: cuánto cuesta una cantidad dada de este
 *   insumo.
 */
export class PurchasePrice {
    private constructor(
        /** Monto pagado por la presentación de compra completa (en `currency`). */
        readonly amount: number,   // Nivel 1: costo pagado por la presentación completa
        /** La presentación comprada, en la unidad base del insumo (g | u). */
        readonly per: Quantity,    // Nivel 1: presentación comprada normalizada a la unidad base
        /** Código de moneda ISO 4217 (p. ej. 'PEN' para el sol peruano). */
        readonly currency: string, // Nivel 1: moneda del monto (identifica la unidad monetaria)
    ) {}

    static of(amount: number, per: Quantity, currency = 'PEN'): PurchasePrice {
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error(`Purchase price must be a finite positive number, got ${amount}`);
        }
        return new PurchasePrice(amount, per, currency);
    }

    /** Costo de una unidad base (p. ej. soles por gramo). Cálculo de referencia vivo. */
    perBaseUnit(): number {
        return this.amount / this.per.value;
    }

    /** Regla de tres: costo de `quantity` de este insumo (misma unidad que `per`). */
    costFor(quantity: Quantity): number {
        if (quantity.unit !== this.per.unit) {
            throw new Error(
                `Cannot price a ${quantity.unit} quantity against a ${this.per.unit} purchase`,
            );
        }
        return quantity.value * this.perBaseUnit();
    }

    equals(other: PurchasePrice): boolean {
        return this.amount === other.amount && this.per.equals(other.per) && this.currency === other.currency;
    }

    toString(): string {
        return `${this.per.toString()} · ${symbolFor(this.currency)} ${this.amount}`;
    }
}

/** Mapea el código ISO 4217 a su símbolo visible; si no lo conoce, usa el propio código. */
export function symbolFor(currency: string): string {
    return currency === 'PEN' ? 'S/' : currency;
}
