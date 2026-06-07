import { TestBed } from '@angular/core/testing';
import { makeRecipeBookFakes } from '../../testing/recipe-book-test-doubles';
import { SaveIngredient } from './save-ingredient.use-case';
import { SaveTopper } from './save-topper.use-case';
import { ListRecipeBook } from './list-recipe-book.use-case';

describe('ListRecipeBook', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
    });

    it('returns an empty catalog when nothing has been saved', async () => {
        const catalog = await TestBed.inject(ListRecipeBook).execute();
        expect(catalog.ingredients).toHaveLength(0);
        expect(catalog.toppers).toHaveLength(0);
        expect(catalog.sponges).toHaveLength(0);
    });

    it('groups saved aggregates by type', async () => {
        await TestBed.inject(SaveIngredient).execute({ name: 'Harina', baseUnit: 'g' });
        await TestBed.inject(SaveIngredient).execute({ name: 'Huevos', baseUnit: 'u' });
        await TestBed.inject(SaveTopper).execute({ name: 'Feliz cumpleaños' });

        const catalog = await TestBed.inject(ListRecipeBook).execute();
        expect(catalog.ingredients).toHaveLength(2);
        expect(catalog.toppers).toHaveLength(1);
        expect(catalog.toppers[0].name).toBe('Feliz cumpleaños');
    });
});
