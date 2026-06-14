import { TestBed } from '@angular/core/testing';
import { PreviewRecipeCost } from '../../../application/use-cases/preview-recipe-cost.use-case';

describe('PreviewRecipeCost', () => {
    let preview: PreviewRecipeCost;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        preview = TestBed.inject(PreviewRecipeCost);
    });

    it('computes per-line cost and the materials total, all formatted', async () => {
        const result = await preview.execute({
            lines: [
                { purchasePrice: { amount: 5, per: { value: 1000, unit: 'g' } }, quantity: { value: 300, unit: 'g' } }, // 1.50
                { purchasePrice: { amount: 12, per: { value: 30, unit: 'u' } }, quantity: { value: 5, unit: 'u' } }, // 2.00
            ],
        });

        expect(result.items.map((i) => i.cost)).toEqual(['S/ 1.50', 'S/ 2.00']);
        expect(result.total).toBe('S/ 3.50');
    });

    it('leaves the cost empty (and excludes from the total) for lines without price or quantity', async () => {
        const result = await preview.execute({
            lines: [
                { purchasePrice: { amount: 5, per: { value: 1000, unit: 'g' } }, quantity: { value: 200, unit: 'g' } }, // 1.00
                { purchasePrice: null, quantity: { value: 100, unit: 'g' } }, // no price
                { purchasePrice: { amount: 5, per: { value: 1000, unit: 'g' } } }, // no quantity yet
            ],
        });

        expect(result.items.map((i) => i.cost)).toEqual(['S/ 1.00', '', '']);
        expect(result.total).toBe('S/ 1.00');
    });

    it('ignores a line whose unit does not match its purchase unit', async () => {
        const result = await preview.execute({
            lines: [{ purchasePrice: { amount: 5, per: { value: 1000, unit: 'g' } }, quantity: { value: 2, unit: 'u' } }],
        });
        expect(result.items[0].cost).toBe('');
        expect(result.total).toBe('S/ 0.00');
    });
});
