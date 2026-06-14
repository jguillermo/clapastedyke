import { TestBed } from '@angular/core/testing';
import { aPurchase, makeRecipeBookFakes, RecordingEventBus } from '../../recipe-book-test-doubles';
import { IngredientRepository } from '../../../domain/repositories/ingredient.repository';
import { EventBus } from '../../../../_common/event-bus';
import { EntityId } from '../../../../_common/entity-id';
import { SaveIngredient } from '../../../application/use-cases/save-ingredient.use-case';

describe('SaveIngredient', () => {
    let bus: RecordingEventBus;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
        bus = TestBed.inject(EventBus) as RecordingEventBus;
    });

    it('creates a new ingredient with its price and emits IngredientSaved + IngredientRepriced', async () => {
        const result = await TestBed.inject(SaveIngredient).execute({
            name: 'Harina',
            baseUnit: 'g',
            usage: 'recipe',
            purchasePrice: aPurchase('g'),
        });

        const stored = await TestBed.inject(IngredientRepository).byId(new EntityId(result.id));
        expect(stored?.name).toBe('Harina');
        expect(stored?.purchasePrice.amount).toBe(5);
        expect(bus.names()).toEqual(['IngredientSaved', 'IngredientRepriced']);
        expect(bus.published[0].data['isNew']).toBe(true);
        expect(bus.published[1].data['previousPrice']).toBeNull();
    });

    it('upserts by name (case-insensitive) without re-pricing when the price is unchanged', async () => {
        const useCase = TestBed.inject(SaveIngredient);
        const first = await useCase.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') });
        const second = await useCase.execute({ name: 'harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') });

        expect(second.id).toBe(first.id);
        expect(await TestBed.inject(IngredientRepository).all()).toHaveLength(1);
        // first: Saved + Repriced; second: only Saved (price unchanged → no reprice)
        expect(bus.names()).toEqual(['IngredientSaved', 'IngredientRepriced', 'IngredientSaved']);
        expect(bus.published[2].data['isNew']).toBe(false);
    });

    it('re-prices an existing ingredient and emits IngredientRepriced with the previous price', async () => {
        const useCase = TestBed.inject(SaveIngredient);
        await useCase.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g', 5) });
        bus.published.length = 0;
        await useCase.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g', 8) });

        expect(bus.names()).toEqual(['IngredientSaved', 'IngredientRepriced']);
        expect(bus.published[1].data['previousPrice']).toEqual({ amount: 5, per: { value: 1000, unit: 'g' } });
        expect(bus.published[1].data['newPrice']).toEqual({ amount: 8, per: { value: 1000, unit: 'g' } });
    });
});
