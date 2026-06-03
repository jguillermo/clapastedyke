import { ValidationError } from './errors';

/**
 * Money value object in soles (S/). Stores TEN-THOUSANDTHS of a sol as an
 * integer (4 decimals): the real precision of the original system, where
 * prices per base unit are fractions of a cent (S/ 5 ÷ 1000 g = 0.005/g).
 * Immutable and side-effect free.
 */
const SCALE = 10_000;

export class Money {
  private constructor(readonly tenThousandths: number) {}

  static fromSoles(soles: number): Money {
    if (!Number.isFinite(soles)) throw new ValidationError(`Invalid amount: ${soles}.`);
    return new Money(Math.round(soles * SCALE));
  }

  static zero(): Money {
    return new Money(0);
  }

  get soles(): number {
    return this.tenThousandths / SCALE;
  }

  /** Rounded cents (for 2-decimal display/export). */
  get cents(): number {
    return Math.round(this.tenThousandths / 100);
  }

  add(other: Money): Money {
    return new Money(this.tenThousandths + other.tenThousandths);
  }

  subtract(other: Money): Money {
    return new Money(this.tenThousandths - other.tenThousandths);
  }

  /** Multiplies by a scalar (quantities, factors); rounds to ten-thousandth. */
  multiplyBy(factor: number): Money {
    if (!Number.isFinite(factor)) throw new ValidationError(`Invalid factor: ${factor}.`);
    return new Money(Math.round(this.tenThousandths * factor));
  }

  /** Divides by a scalar (e.g. price per base unit); rounds to ten-thousandth. */
  divideBy(divisor: number): Money {
    if (!Number.isFinite(divisor) || divisor === 0) {
      throw new ValidationError(`Invalid divisor: ${divisor}.`);
    }
    return new Money(Math.round(this.tenThousandths / divisor));
  }

  equals(other: Money): boolean {
    return this.tenThousandths === other.tenThousandths;
  }

  isGreaterThan(other: Money): boolean {
    return this.tenThousandths > other.tenThousandths;
  }

  isNegative(): boolean {
    return this.tenThousandths < 0;
  }

  /** 'S/ 12.50' (2 decimals, es-PE thousands separator). */
  format(): string {
    return `S/ ${this.soles.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /** '0.0050' (4 decimals — base-unit prices, like num4 in the GAS system). */
  format4(): string {
    return this.soles.toLocaleString('es-PE', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }
}
