import { Quantity } from '../../../../_common/quantity';
import { WeightRange } from '../../../domain/value-objects/weight-range';

const g = (v: number) => Quantity.of(v, 'g');

describe('WeightRange', () => {
    it('requires max greater than min', () => {
        expect(() => WeightRange.of(g(1500), g(500))).toThrow();
        expect(() => WeightRange.of(g(1000), g(1000))).toThrow();
        expect(() => WeightRange.of(g(500), g(1500))).not.toThrow();
    });

    it('contains weights within the band (inclusive)', () => {
        const range = WeightRange.of(g(500), g(1500));
        expect(range.contains(g(500))).toBe(true);
        expect(range.contains(g(1000))).toBe(true);
        expect(range.contains(g(1500))).toBe(true);
        expect(range.contains(g(1501))).toBe(false);
        expect(range.contains(g(499))).toBe(false);
    });

    it('detects overlap with another band', () => {
        const a = WeightRange.of(g(500), g(1500));
        expect(a.overlaps(WeightRange.of(g(1000), g(2000)))).toBe(true);
        expect(a.overlaps(WeightRange.of(g(1500), g(2500)))).toBe(true); // touch at boundary
        expect(a.overlaps(WeightRange.of(g(1501), g(2500)))).toBe(false);
    });

    it('is equal by value', () => {
        expect(WeightRange.of(g(500), g(1500)).equals(WeightRange.of(g(500), g(1500)))).toBe(true);
    });
});
