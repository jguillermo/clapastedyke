import { TestBed } from '@angular/core/testing';
import { aPurchase, makeRecipeBookFakes } from '../../recipe-book-test-doubles';
import { SaveIngredient } from '../../../application/use-cases/save-ingredient.use-case';
import { ListRecipeBook } from '../../../application/use-cases/list-recipe-book.use-case';

describe('ListRecipeBook', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
    });

    it('returns an empty catalog when nothing has been saved', async () => {
        const catalog = await TestBed.inject(ListRecipeBook).execute();
        expect(catalog.ingredients).toHaveLength(0);
        expect(catalog.sponges).toHaveLength(0);
    });

    it('returns every saved ingredient, including topper/box/base (told apart by usage)', async () => {
        const ing = TestBed.inject(SaveIngredient);
        await ing.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') });
        await ing.execute({ name: 'Huevos', baseUnit: 'u', usage: 'recipe', purchasePrice: aPurchase('u') });
        await ing.execute({ name: 'Feliz cumpleaños', baseUnit: 'u', usage: 'topper', purchasePrice: aPurchase('u') });

        const catalog = await TestBed.inject(ListRecipeBook).execute();
        expect(catalog.ingredients).toHaveLength(3);
        expect(catalog.ingredients.filter((i) => i.usage === 'topper')).toHaveLength(1);
        expect(catalog.ingredients.find((i) => i.usage === 'topper')?.name).toBe('Feliz cumpleaños');
    });
});
