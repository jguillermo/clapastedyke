import { TestBed } from '@angular/core/testing';
import { makeRecipeBookFakes, RecordingEventBus } from '../../recipe-book-test-doubles';
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

    it('creates a new ingredient and emits IngredientSaved with isNew=true', async () => {
        const result = await TestBed.inject(SaveIngredient).execute({ name: 'Harina', baseUnit: 'g' });

        const stored = await TestBed.inject(IngredientRepository).byId(new EntityId(result.id));
        expect(stored?.name).toBe('Harina');
        expect(bus.published).toHaveLength(1);
        expect(bus.published[0].name).toBe('IngredientSaved');
        expect(bus.published[0].data['isNew']).toBe(true);
    });

    it('upserts by name (case-insensitive): same id, isNew=false', async () => {
        const useCase = TestBed.inject(SaveIngredient);
        const first = await useCase.execute({ name: 'Harina', baseUnit: 'g' });
        const second = await useCase.execute({ name: 'harina', baseUnit: 'u' });

        expect(second.id).toBe(first.id);
        expect(await TestBed.inject(IngredientRepository).all()).toHaveLength(1);
        expect(bus.published[1].data['isNew']).toBe(false);
    });
});
