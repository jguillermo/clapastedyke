import { Quantity } from '../../../_common/quantity';

/**
 * Purchase price of an ingredient — a *conceptual whole* value object (identity
 * by value, immutable). Models **how Ariana buys it**: the presentation she
 * buys (`per`, e.g. 1000 g or 30 u) and what that purchase costs (`amount`, in
 * soles). It is a buying cost, never a selling price.
 *
 * Behaviour is side-effect-free and returns values:
 * - {@link perBaseUnit} — cost per base unit (the "price per gram/unit"), a
 *   live reference calculation.
 * - {@link costFor} — rule of three: what a given quantity of this ingredient
 *   costs.
 */
export class PurchasePrice {
    private constructor(
        /** Soles paid for the whole purchase presentation. */
        readonly amount: number,
        /** The presentation bought, in the ingredient's base unit (g | u). */
        readonly per: Quantity,
    ) {}

    static of(amount: number, per: Quantity): PurchasePrice {
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error(`Purchase price must be a finite positive number, got ${amount}`);
        }
        return new PurchasePrice(amount, per);
    }

    /** Cost of one base unit (e.g. soles per gram). Live reference calc. */
    perBaseUnit(): number {
        return this.amount / this.per.value;
    }

    /** Rule of three: cost of `quantity` of this ingredient (same unit as `per`). */
    costFor(quantity: Quantity): number {
        if (quantity.unit !== this.per.unit) {
            throw new Error(
                `Cannot price a ${quantity.unit} quantity against a ${this.per.unit} purchase`,
            );
        }
        return quantity.value * this.perBaseUnit();
    }

    equals(other: PurchasePrice): boolean {
        return this.amount === other.amount && this.per.equals(other.per);
    }

    toString(): string {
        return `${this.per.toString()} · S/ ${this.amount}`;
    }
}
