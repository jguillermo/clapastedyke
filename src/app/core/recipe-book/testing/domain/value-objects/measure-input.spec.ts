import { KG_MAGNITUDE_THRESHOLD, MeasureInput } from '../../../domain/value-objects/measure-input';

describe('MeasureInput', () => {
    describe('mass — explicit unit wins over magnitude', () => {
        it('reads a leading-k token as kilos and normalises to grams', () => {
            for (const raw of ['1k', '1 kg', '1kilo', '1 KILOS']) {
                const m = MeasureInput.parse(raw, 'mass');
                expect(m.unit).toBe('kg');
                expect(m.quantity?.value).toBe(1000);
                expect(m.quantity?.unit).toBe('g');
            }
        });

        it('reads a leading-g token as grams', () => {
            for (const raw of ['400g', '400 g', '400 gr', '400 gramos']) {
                const m = MeasureInput.parse(raw, 'mass');
                expect(m.unit).toBe('g');
                expect(m.quantity?.value).toBe(400);
            }
        });

        it('honours the token even when magnitude would say otherwise', () => {
            // 1 with grams token → 1 g (not 1 kg); 400 with kilo token → 400 000 g
            expect(MeasureInput.parse('1 g', 'mass').quantity?.value).toBe(1);
            expect(MeasureInput.parse('400 k', 'mass').quantity?.value).toBe(400000);
        });
    });

    describe('mass — magnitude threshold when no token', () => {
        it(`reads values below ${KG_MAGNITUDE_THRESHOLD} as kilos`, () => {
            expect(MeasureInput.parse('1', 'mass').unit).toBe('kg');
            expect(MeasureInput.parse('1', 'mass').quantity?.value).toBe(1000);
            const justBelow = MeasureInput.parse('9.99', 'mass');
            expect(justBelow.unit).toBe('kg');
            expect(justBelow.quantity?.value).toBeCloseTo(9990);
        });

        it(`reads values at or above ${KG_MAGNITUDE_THRESHOLD} as grams`, () => {
            expect(MeasureInput.parse('10', 'mass').unit).toBe('g');
            expect(MeasureInput.parse('10', 'mass').quantity?.value).toBe(10);
            expect(MeasureInput.parse('400', 'mass').unit).toBe('g');
            expect(MeasureInput.parse('400', 'mass').quantity?.value).toBe(400);
        });
    });

    describe('locale and validity', () => {
        it('accepts a comma as decimal separator', () => {
            expect(MeasureInput.parse('1,5 kg', 'mass').quantity?.value).toBe(1500);
        });

        it('is invalid for empty, non-numeric, zero or unknown unit', () => {
            for (const raw of ['', '   ', 'abc', '0', '-2', '400x']) {
                expect(MeasureInput.parse(raw, 'mass').isValid).toBe(false);
                expect(MeasureInput.parse(raw, 'mass').quantity).toBeNull();
            }
        });

        it('still exposes a provisional unit hint when empty', () => {
            expect(MeasureInput.parse('', 'mass').unit).toBe('kg');
        });
    });

    describe('count', () => {
        it('always resolves to base unit u and ignores any unit token', () => {
            const m = MeasureInput.parse('5', 'count');
            expect(m.unit).toBe('u');
            expect(m.baseUnit).toBe('u');
            expect(m.quantity?.value).toBe(5);
            expect(m.quantity?.unit).toBe('u');
        });

        it('is invalid for non-positive or non-numeric counts', () => {
            expect(MeasureInput.parse('0', 'count').isValid).toBe(false);
            expect(MeasureInput.parse('abc', 'count').isValid).toBe(false);
        });
    });

    describe('any — base unit inferred from what the user types', () => {
        it('reads a u token as a count (baseUnit u)', () => {
            const m = MeasureInput.parse('6 u', 'any');
            expect(m.unit).toBe('u');
            expect(m.baseUnit).toBe('u');
            expect(m.quantity?.value).toBe(6);
            expect(m.quantity?.unit).toBe('u');
        });

        it('reads a bare or g/kg amount as mass (baseUnit g)', () => {
            expect(MeasureInput.parse('250', 'any').baseUnit).toBe('g');
            expect(MeasureInput.parse('250', 'any').quantity?.value).toBe(250);
            expect(MeasureInput.parse('1 kg', 'any').baseUnit).toBe('g');
            expect(MeasureInput.parse('1 kg', 'any').quantity?.value).toBe(1000);
        });
    });

    it('treats a u token as invalid for a mass field', () => {
        expect(MeasureInput.parse('5 u', 'mass').isValid).toBe(false);
    });

    it('is equal by normalised value and unit', () => {
        expect(MeasureInput.parse('1 kg', 'mass').equals(MeasureInput.parse('1000 g', 'mass'))).toBe(false);
        // same display unit + same grams → equal
        expect(MeasureInput.parse('1kg', 'mass').equals(MeasureInput.parse('1 kilo', 'mass'))).toBe(true);
    });
});
