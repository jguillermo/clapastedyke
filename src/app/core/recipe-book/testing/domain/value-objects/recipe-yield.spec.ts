import { Quantity } from '../../../../_common/quantity';
import { RecipeYield } from '../../../domain/value-objects/recipe-yield';

describe('RecipeYield', () => {
    it('accepts a positive weight with optional servings', () => {
        const y = RecipeYield.of(Quantity.of(1000, 'g'), 8);
        expect(y.weight.value).toBe(1000);
        expect(y.servings).toBe(8);
    });

    it('allows omitting servings', () => {
        expect(RecipeYield.of(Quantity.of(1000, 'g')).servings).toBeUndefined();
    });

    it('carries an optional size label (tamaño) and trims it', () => {
        expect(RecipeYield.of(Quantity.of(1000, 'g'), 8, 'Mediano').size).toBe('Mediano');
        expect(RecipeYield.of(Quantity.of(1000, 'g'), 8, '  ').size).toBeUndefined();
        expect(RecipeYield.of(Quantity.of(1000, 'g')).size).toBeUndefined();
    });

    it('rejects non-positive servings', () => {
        expect(() => RecipeYield.of(Quantity.of(1000, 'g'), 0)).toThrow();
        expect(() => RecipeYield.of(Quantity.of(1000, 'g'), -2)).toThrow();
    });

    it('is equal by value', () => {
        const a = RecipeYield.of(Quantity.of(1000, 'g'), 8);
        const b = RecipeYield.of(Quantity.of(1000, 'g'), 8);
        expect(a.equals(b)).toBe(true);
        expect(a.equals(RecipeYield.of(Quantity.of(1000, 'g'), 10))).toBe(false);
    });
});
