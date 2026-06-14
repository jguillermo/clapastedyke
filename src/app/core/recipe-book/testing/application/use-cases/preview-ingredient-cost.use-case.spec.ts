import { TestBed } from '@angular/core/testing';
import { PreviewIngredientCost } from '../../../application/use-cases/preview-ingredient-cost.use-case';

describe('PreviewIngredientCost', () => {
    let preview: PreviewIngredientCost;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        preview = TestBed.inject(PreviewIngredientCost);
    });

    it('returns the proportional cost, per-unit label and ghost reference, all formatted', async () => {
        const result = await preview.execute({
            purchasePrice: { amount: 5, per: { value: 1000, unit: 'g' } },
            quantity: { value: 300, unit: 'g' },
        });

        expect(result.cost).toBe('S/ 1.50');
        expect(result.perBaseUnitLabel).toBe('S/ 0.0050 por g');
        expect(result.reference).toBe('1 kg · S/ 5');
    });

    it('omits the cost when there is no quantity yet (still shows the reference)', async () => {
        const result = await preview.execute({ purchasePrice: { amount: 5, per: { value: 1000, unit: 'g' } } });

        expect(result.cost).toBe('');
        expect(result.reference).toBe('1 kg · S/ 5');
    });

    it('omits the cost when the line unit does not match the purchase unit', async () => {
        const result = await preview.execute({
            purchasePrice: { amount: 5, per: { value: 1000, unit: 'g' } },
            quantity: { value: 2, unit: 'u' },
        });
        expect(result.cost).toBe('');
    });
});
