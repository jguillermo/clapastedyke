/** Base units of the system: grams or countable units. */
export type BaseUnit = 'g' | 'u';

/**
 * Quantity value object — a conceptual whole grouping a value and its base
 * unit. Immutable, equality by value. Behaviour is side-effect-free and
 * returns a new instance (value semantics, never application logic).
 */
export class Quantity {
    private constructor(
        readonly value: number,
        readonly unit: BaseUnit,
    ) {}

    static of(value: number, unit: BaseUnit): Quantity {
        if (!Number.isFinite(value) || value <= 0) {
            throw new Error(`Quantity must be a finite positive number, got ${value}`);
        }
        return new Quantity(value, unit);
    }

    /** Scales the quantity by a non-negative dimensionless factor. */
    scaleBy(factor: number): Quantity {
        if (!Number.isFinite(factor) || factor < 0) {
            throw new Error(`Scaling factor must be a finite non-negative number, got ${factor}`);
        }
        return new Quantity(this.value * factor, this.unit);
    }

    /** Adds another quantity of the same unit. */
    add(other: Quantity): Quantity {
        this.requireSameUnit(other);
        return new Quantity(this.value + other.value, this.unit);
    }

    /** Dimensionless ratio against another quantity of the same unit (scaling factor). */
    ratioTo(other: Quantity): number {
        this.requireSameUnit(other);
        return this.value / other.value;
    }

    equals(other: Quantity): boolean {
        return this.value === other.value && this.unit === other.unit;
    }

    toString(): string {
        return `${this.value} ${this.unit}`;
    }

    private requireSameUnit(other: Quantity): void {
        if (this.unit !== other.unit) {
            throw new Error(`Cannot operate on quantities of different units: ${this.unit} and ${other.unit}`);
        }
    }
}
