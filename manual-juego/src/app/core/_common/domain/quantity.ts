import { ValidationError } from './errors';

/** Base units of the system: grams or units. */
export type BaseUnit = 'g' | 'u';

/**
 * Quantity value object: a value with its base unit. Immutable.
 * Quantities may be fractional (e.g. 12.5 g) but never negative, except via
 * the explicit signed constructor (stock movements).
 */
export class Quantity {
  private constructor(
    readonly value: number,
    readonly unit: BaseUnit,
  ) {}

  static of(value: number, unit: BaseUnit): Quantity {
    if (!Number.isFinite(value) || value < 0) {
      throw new ValidationError(`Invalid quantity: ${value}.`);
    }
    return new Quantity(value, unit);
  }

  /** For stock movements: allows sign (negative = outflow). */
  static signed(value: number, unit: BaseUnit): Quantity {
    if (!Number.isFinite(value)) throw new ValidationError(`Invalid quantity: ${value}.`);
    return new Quantity(value, unit);
  }

  add(other: Quantity): Quantity {
    this.requireSameUnit(other);
    return new Quantity(this.value + other.value, this.unit);
  }

  scaleBy(factor: number): Quantity {
    if (!Number.isFinite(factor) || factor < 0) {
      throw new ValidationError(`Invalid scaling factor: ${factor}.`);
    }
    return new Quantity(this.value * factor, this.unit);
  }

  equals(other: Quantity): boolean {
    return this.unit === other.unit && this.value === other.value;
  }

  private requireSameUnit(other: Quantity): void {
    if (this.unit !== other.unit) {
      throw new ValidationError(`Cannot operate quantities in ${this.unit} and ${other.unit}.`);
    }
  }
}
