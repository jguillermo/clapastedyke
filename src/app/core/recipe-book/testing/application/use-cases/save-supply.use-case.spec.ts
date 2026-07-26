import { TestBed } from '@angular/core/testing';
import { aPurchase, makeRecipeBookFakes, RecordingEventBus } from '../../recipe-book-test-doubles';
import { SupplyRepository } from '../../../domain/repositories/supply.repository';
import { EventBus } from '../../../../_common/event-bus';
import { EntityId } from '../../../../_common/entity-id';
import { SaveSupply } from '../../../application/use-cases/save-supply.use-case';

describe('SaveSupply', () => {
    let bus: RecordingEventBus;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
        bus = TestBed.inject(EventBus) as RecordingEventBus;
    });

    it('creates a new supply with its price and emits SupplySaved', async () => {
        const result = await TestBed.inject(SaveSupply).execute({
            name: 'Harina',
            baseUnit: 'g',
            usage: 'recipe',
            purchasePrice: aPurchase('g'),
        });

        const stored = await TestBed.inject(SupplyRepository).byId(new EntityId(result.id));
        expect(stored?.name).toBe('Harina');
        expect(stored?.purchasePrice.amount).toBe(5);
        expect(bus.names()).toEqual(['SupplySaved']);
        expect(bus.published[0].data['isNew']).toBe(true);
    });

    it('upserts by name (case-insensitive) without re-pricing when the price is unchanged', async () => {
        const useCase = TestBed.inject(SaveSupply);
        const first = await useCase.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') });
        const second = await useCase.execute({ name: 'harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') });

        expect(second.id).toBe(first.id);
        expect(await TestBed.inject(SupplyRepository).all()).toHaveLength(1);
        expect(bus.names()).toEqual(['SupplySaved', 'SupplySaved']);
        expect(bus.published[1].data['isNew']).toBe(false);
    });

    it('re-prices an existing supply, persisting the new price', async () => {
        const useCase = TestBed.inject(SaveSupply);
        const first = await useCase.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g', 5) });
        bus.published.length = 0;
        await useCase.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g', 8) });

        const stored = await TestBed.inject(SupplyRepository).byId(new EntityId(first.id));
        expect(stored?.purchasePrice.amount).toBe(8);
        expect(bus.names()).toEqual(['SupplySaved']);
    });
});
