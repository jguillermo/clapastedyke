import { TestBed } from '@angular/core/testing';
import {
  aPurchase,
  makeSupply,
  makeRecipeBookFakes,
  RecordingEventBus,
} from '../../recipe-book-test-doubles';
import { SupplyRepository } from '../../../domain/repositories/supply.repository';
import { EventBus } from '../../../../_common/eventbus/event-bus';
import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { UpdateSupply } from '../../../application/use-cases/update-supply.use-case';

describe('UpdateSupply', () => {
  let bus: RecordingEventBus;
  let repo: SupplyRepository;
  let useCase: UpdateSupply;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
    bus = TestBed.inject(EventBus) as RecordingEventBus;
    repo = TestBed.inject(SupplyRepository);
    useCase = TestBed.inject(UpdateSupply);
  });

  it('renames an existing ingredient keeping its identity (no duplicate)', async () => {
    await repo.save(makeSupply('IN-1', 'Harina'));
    bus.published.length = 0;

    const result = await useCase.execute({
      id: 'IN-1',
      name: 'Harina sin gluten',
      purchasePrice: aPurchase('g'),
    });

    expect(result.id).toBe('IN-1');
    const all = await repo.all();
    expect(all).toHaveLength(1);
    expect((await repo.byId(new EntityId('IN-1')))?.name).toBe('Harina sin gluten');
    // Cambio solo de nombre: sin evento de repreciado, solo SupplySaved.
    expect(bus.names()).toEqual(['SupplySaved']);
    expect(bus.published[0].data['isNew']).toBe(false);
  });

  it('re-prices an existing supply, persisting the new price', async () => {
    await repo.save(makeSupply('IN-1', 'Harina', { amount: 5, per: Quantity.of(1000, 'g') }));
    bus.published.length = 0;

    await useCase.execute({
      id: 'IN-1',
      name: 'Harina',
      purchasePrice: { amount: 8, per: { value: 1000, unit: 'g' } },
    });

    expect((await repo.byId(new EntityId('IN-1')))?.purchasePrice.amount).toBe(8);
    expect(bus.names()).toEqual(['SupplySaved']);
  });

  it('rejects a rename that collides with another ingredient', async () => {
    await repo.save(makeSupply('IN-1', 'Harina'));
    await repo.save(makeSupply('IN-2', 'Azúcar'));

    await expect(
      useCase.execute({ id: 'IN-2', name: 'harina', purchasePrice: aPurchase('g') }),
    ).rejects.toThrow('Ya existe un insumo con ese nombre');
    expect((await repo.byId(new EntityId('IN-2')))?.name).toBe('Azúcar');
  });

  it('throws when the ingredient does not exist', async () => {
    await expect(
      useCase.execute({ id: 'missing', name: 'Harina', purchasePrice: aPurchase('g') }),
    ).rejects.toThrow('Supply not found');
  });

  it('does not reprice when nothing changed', async () => {
    await repo.save(makeSupply('IN-1', 'Harina', { amount: 5, per: Quantity.of(1000, 'g') }));
    bus.published.length = 0;

    await useCase.execute({
      id: 'IN-1',
      name: 'Harina',
      purchasePrice: { amount: 5, per: { value: 1000, unit: 'g' } },
    });

    expect(bus.names()).toEqual(['SupplySaved']);
  });
});
