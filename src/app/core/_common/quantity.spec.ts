import { Quantity } from './quantity';

describe('Quantity', () => {
    it('is equal by value and unit', () => {
        expect(Quantity.of(250, 'g').equals(Quantity.of(250, 'g'))).toBe(true);
        expect(Quantity.of(250, 'g').equals(Quantity.of(251, 'g'))).toBe(false);
        expect(Quantity.of(1, 'u').equals(Quantity.of(1, 'g'))).toBe(false);
    });

    it('rejects non-positive or non-finite values', () => {
        expect(() => Quantity.of(0, 'g')).toThrow();
        expect(() => Quantity.of(-5, 'g')).toThrow();
        expect(() => Quantity.of(Number.NaN, 'g')).toThrow();
    });

    it('scaleBy returns a new instance and leaves the original untouched', () => {
        const original = Quantity.of(250, 'g');
        const scaled = original.scaleBy(2);
        expect(scaled.value).toBe(500);
        expect(original.value).toBe(250);
        expect(scaled).not.toBe(original);
    });

    it('scaleBy rejects negative factors', () => {
        expect(() => Quantity.of(250, 'g').scaleBy(-1)).toThrow();
    });

    it('add sums quantities of the same unit', () => {
        expect(Quantity.of(250, 'g').add(Quantity.of(50, 'g')).value).toBe(300);
    });

    it('add rejects mixed units', () => {
        expect(() => Quantity.of(250, 'g').add(Quantity.of(1, 'u'))).toThrow();
    });

    it('ratioTo yields a dimensionless scaling factor', () => {
        expect(Quantity.of(2000, 'g').ratioTo(Quantity.of(1000, 'g'))).toBe(2);
    });

    it('ratioTo rejects mixed units', () => {
        expect(() => Quantity.of(2000, 'g').ratioTo(Quantity.of(1, 'u'))).toThrow();
    });
});
