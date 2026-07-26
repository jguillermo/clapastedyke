import { TestBed } from '@angular/core/testing';
import { aPurchase, makeRecipeBookFakes } from '../../recipe-book-test-doubles';
import { SaveSupply } from '../../../application/use-cases/save-supply.use-case';
import { ListRecipeBook } from '../../../application/use-cases/list-recipe-book.use-case';

describe('ListRecipeBook', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
    });

    it('returns an empty catalog when nothing has been saved', async () => {
        const catalog = await TestBed.inject(ListRecipeBook).execute();
        expect(catalog.supplies).toHaveLength(0);
        expect(catalog.categories).toHaveLength(0);
        expect(catalog.recipes).toHaveLength(0);
    });

    it('returns every saved ingredient, including topper/box/base (told apart by usage)', async () => {
        const ing = TestBed.inject(SaveSupply);
        await ing.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') });
        await ing.execute({ name: 'Huevos', baseUnit: 'u', usage: 'recipe', purchasePrice: aPurchase('u') });
        await ing.execute({ name: 'Feliz cumpleaños', baseUnit: 'u', usage: 'topper', purchasePrice: aPurchase('u') });

        const catalog = await TestBed.inject(ListRecipeBook).execute();
        expect(catalog.supplies).toHaveLength(3);
        expect(catalog.supplies.filter((i) => i.usage === 'topper')).toHaveLength(1);
        expect(catalog.supplies.find((i) => i.usage === 'topper')?.name).toBe('Feliz cumpleaños');
    });
});
