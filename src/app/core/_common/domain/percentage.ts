import { ValidationError } from './errors';

/**
 * Percentage value object in [0, 100): profit margin, IGV tax rate.
 * The open upper bound protects the margin-on-sale formula
 * (price = cost / (1 − margin/100)), which would divide by zero at 100.
 */
export class Percentage {
  private constructor(readonly value: number) {}

  static of(value: number): Percentage {
    if (!Number.isFinite(value) || value < 0 || value >= 100) {
      throw new ValidationError(`Percentage out of range [0, 100): ${value}.`);
    }
    return new Percentage(value);
  }

  /** 35 → 0.35 */
  get fraction(): number {
    return this.value / 100;
  }

  equals(other: Percentage): boolean {
    return this.value === other.value;
  }
}
