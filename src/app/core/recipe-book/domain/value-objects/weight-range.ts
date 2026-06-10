import { Quantity } from '../../../_common/quantity';

interface WeightRangeData {
    min: Quantity;
    max: Quantity;
}

/**
 * A weight band used by packaging rules: from `min` to `max` (inclusive).
 * Invariant: max > min. Identity by value.
 */
export class WeightRange {
    readonly min: Quantity;
    readonly max: Quantity;

    private constructor(data: WeightRangeData) {
        this.min = data.min;
        this.max = data.max;
    }

    static of(min: Quantity, max: Quantity): WeightRange {
        if (min.unit !== max.unit) {
            throw new Error(`Weight range bounds must share a unit: ${min.unit} and ${max.unit}`);
        }
        if (max.value <= min.value) {
            throw new Error(`Weight range max (${max.value}) must be greater than min (${min.value})`);
        }
        return new WeightRange({ min, max });
    }

    /** True when `weight` falls within the band (min ≤ weight ≤ max). */
    contains(weight: Quantity): boolean {
        return weight.value >= this.min.value && weight.value <= this.max.value;
    }

    /** True when this band shares any weight with `other`. */
    overlaps(other: WeightRange): boolean {
        return this.min.value <= other.max.value && other.min.value <= this.max.value;
    }

    equals(other: WeightRange): boolean {
        return this.min.equals(other.min) && this.max.equals(other.max);
    }
}
