import { TestBed } from '@angular/core/testing';
import { aPurchase, makeIngredient, makeRecipeBookFakes, RecordingEventBus } from '../../recipe-book-test-doubles';
import { IngredientRepository } from '../../../domain/repositories/ingredient.repository';
import { EventBus } from '../../../../_common/event-bus';
import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { UpdateIngredient } from '../../../application/use-cases/update-ingredient.use-case';

describe('UpdateIngredient', () => {
    let bus: RecordingEventBus;
    let repo: IngredientRepository;
    let useCase: UpdateIngredient;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
        bus = TestBed.inject(EventBus) as RecordingEventBus;
        repo = TestBed.inject(IngredientRepository);
        useCase = TestBed.inject(UpdateIngredient);
    });

    it('renames an existing ingredient keeping its identity (no duplicate)', async () => {
        await repo.save(makeIngredient('IN-1', 'Harina'));
        bus.published.length = 0;

        const result = await useCase.execute({ id: 'IN-1', name: 'Harina sin gluten', purchasePrice: aPurchase('g') });

        expect(result.id).toBe('IN-1');
        const all = await repo.all();
        expect(all).toHaveLength(1);
        expect((await repo.byId(new EntityId('IN-1')))?.name).toBe('Harina sin gluten');
        // Name-only change: no reprice event, just IngredientSaved.
        expect(bus.names()).toEqual(['IngredientSaved']);
        expect(bus.published[0].data['isNew']).toBe(false);
    });

    it('re-prices an existing ingredient and emits IngredientRepriced with the previous price', async () => {
        await repo.save(makeIngredient('IN-1', 'Harina', { amount: 5, per: Quantity.of(1000, 'g') }));
        bus.published.length = 0;

        await useCase.execute({ id: 'IN-1', name: 'Harina', purchasePrice: { amount: 8, per: { value: 1000, unit: 'g' } } });

        expect(bus.names()).toEqual(['IngredientSaved', 'IngredientRepriced']);
        expect(bus.published[1].data['previousPrice']).toEqual({ amount: 5, per: { value: 1000, unit: 'g' } });
        expect(bus.published[1].data['newPrice']).toEqual({ amount: 8, per: { value: 1000, unit: 'g' } });
    });

    it('rejects a rename that collides with another ingredient', async () => {
        await repo.save(makeIngredient('IN-1', 'Harina'));
        await repo.save(makeIngredient('IN-2', 'Azúcar'));

        await expect(
            useCase.execute({ id: 'IN-2', name: 'harina', purchasePrice: aPurchase('g') }),
        ).rejects.toThrow('Ya existe un insumo con ese nombre');
        expect((await repo.byId(new EntityId('IN-2')))?.name).toBe('Azúcar');
    });

    it('throws when the ingredient does not exist', async () => {
        await expect(
            useCase.execute({ id: 'missing', name: 'Harina', purchasePrice: aPurchase('g') }),
        ).rejects.toThrow('Ingredient not found');
    });

    it('does not reprice when nothing changed', async () => {
        await repo.save(makeIngredient('IN-1', 'Harina', { amount: 5, per: Quantity.of(1000, 'g') }));
        bus.published.length = 0;

        await useCase.execute({ id: 'IN-1', name: 'Harina', purchasePrice: { amount: 5, per: { value: 1000, unit: 'g' } } });

        expect(bus.names()).toEqual(['IngredientSaved']);
    });
});
