import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EventBus } from '../../../_common/event-bus';
import { InMemoryEventBus } from '../../../_common/in-memory-event-bus';
import { EntityId } from '../../../_common/entity-id';
import { aPurchase, recipeBookRepositoryProviders } from '../recipe-book-test-doubles';
import { SaveIngredient } from '../../application/use-cases/save-ingredient.use-case';
import { IngredientPriceHistoryRepository } from '../../domain/repositories/ingredient-price-history.repository';
import { IngredientPriceRecorder } from '../../infrastructure/ingredient-price-recorder.subscriber';

describe('IngredientPriceRecorder (event → price history)', () => {
    beforeEach(() => {
        const providers: Provider[] = [...recipeBookRepositoryProviders, { provide: EventBus, useClass: InMemoryEventBus }];
        TestBed.configureTestingModule({ providers });
        // Wire the subscription (done by provideAppInitializer in production).
        TestBed.inject(IngredientPriceRecorder).register();
    });

    it('records the initial price when an ingredient is created', async () => {
        const { id } = await TestBed.inject(SaveIngredient).execute({
            name: 'Harina',
            baseUnit: 'g',
            usage: 'recipe',
            purchasePrice: aPurchase('g', 5),
        });

        const history = await TestBed.inject(IngredientPriceHistoryRepository).byIngredient(new EntityId(id));
        expect(history).toHaveLength(1);
        expect(history[0].price.amount).toBe(5);
    });

    it('appends a new history entry when the price changes (invisible audit)', async () => {
        const save = TestBed.inject(SaveIngredient);
        const { id } = await save.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g', 5) });
        await save.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g', 8) });

        const history = await TestBed.inject(IngredientPriceHistoryRepository).byIngredient(new EntityId(id));
        expect(history.map((e) => e.price.amount)).toEqual([5, 8]);
    });

    it('does not append when the price is unchanged', async () => {
        const save = TestBed.inject(SaveIngredient);
        const { id } = await save.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g', 5) });
        await save.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g', 5) });

        const history = await TestBed.inject(IngredientPriceHistoryRepository).byIngredient(new EntityId(id));
        expect(history).toHaveLength(1);
    });
});
