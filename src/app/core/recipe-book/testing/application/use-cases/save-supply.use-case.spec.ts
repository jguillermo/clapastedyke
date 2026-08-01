import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../../_common/entity-id';
import { EventBus } from '../../../../_common/eventbus/event-bus';
import { aPurchase, makeRecipeBookFakes, RecordingEventBus } from '../../recipe-book-test-doubles';
import { SupplyRepository } from '../../../domain/repositories/supply.repository';
import { SaveSupply } from '../../../application/use-cases/save-supply.use-case';

describe('SaveSupply', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
  });

  it('sin id → acuña la identidad y publica un solo SupplySaved con el nombre', async () => {
    const { id } = await TestBed.inject(SaveSupply).execute({
      name: 'Harina',
      usage: 'recipe',
      purchasePrice: aPurchase('g', 5),
    });

    const saved = await TestBed.inject(SupplyRepository).byId(new EntityId(id));
    expect(saved?.name).toBe('Harina');
    expect(saved?.baseUnit).toBe('g');
    expect(saved?.purchasePrice.amount).toBe(5);

    const bus = TestBed.inject(EventBus) as RecordingEventBus;
    expect(bus.published).toHaveLength(1);
    expect(bus.published[0].name).toBe('SupplySaved');
    expect(bus.published[0].data['name']).toBe('Harina');
  });

  it('sin id y con un nombre que ya está → reusa esa identidad, no duplica', async () => {
    // Es lo que evita que el formulario de receta acuñe un insumo nuevo cada vez que se guarda.
    const uc = TestBed.inject(SaveSupply);
    const a = await uc.execute({ name: 'Harina', purchasePrice: aPurchase('g', 5) });
    const b = await uc.execute({ name: 'harina', purchasePrice: aPurchase('g', 8) });

    expect(b.id).toBe(a.id);
    const repo = TestBed.inject(SupplyRepository);
    expect(await repo.all()).toHaveLength(1);
    expect((await repo.byId(new EntityId(a.id)))?.purchasePrice.amount).toBe(8);
  });

  it('con id → renombrar conserva la identidad que referencian las recetas', async () => {
    const uc = TestBed.inject(SaveSupply);
    const { id } = await uc.execute({ name: 'Harina', purchasePrice: aPurchase('g', 5) });

    await uc.execute({ id, name: 'Harina sin gluten', purchasePrice: aPurchase('g', 9) });

    const repo = TestBed.inject(SupplyRepository);
    const saved = await repo.byId(new EntityId(id));
    expect(saved?.name).toBe('Harina sin gluten');
    expect(saved?.purchasePrice.amount).toBe(9);
    expect(await repo.all()).toHaveLength(1);
  });

  it('guardar sin cambios también publica: no hay diferencia entre crear y actualizar', async () => {
    const uc = TestBed.inject(SaveSupply);
    const { id } = await uc.execute({ name: 'Harina', purchasePrice: aPurchase('g', 5) });
    const bus = TestBed.inject(EventBus) as RecordingEventBus;
    bus.published.length = 0;

    await uc.execute({ id, name: 'Harina', purchasePrice: aPurchase('g', 5) });

    expect(bus.published.map((e) => e.name)).toEqual(['SupplySaved']);
  });

  it('rechaza renombrar con el nombre de OTRO insumo', async () => {
    const uc = TestBed.inject(SaveSupply);
    await uc.execute({ name: 'Harina', purchasePrice: aPurchase('g', 5) });
    const { id } = await uc.execute({ name: 'Azúcar', purchasePrice: aPurchase('g', 4) });

    await expect(
      uc.execute({ id, name: 'Harina', purchasePrice: aPurchase('g', 4) }),
    ).rejects.toThrow('Ya existe un insumo con ese nombre');
  });

  it('conserva el uso del insumo que ya estaba cuando no se manda', async () => {
    const uc = TestBed.inject(SaveSupply);
    const { id } = await uc.execute({
      name: 'Topper estrella',
      usage: 'topper',
      purchasePrice: aPurchase('u', 3),
    });

    await uc.execute({ id, name: 'Topper estrella', purchasePrice: aPurchase('u', 4) });

    expect((await TestBed.inject(SupplyRepository).byId(new EntityId(id)))?.usage).toBe('topper');
  });

  it('rechaza cambiar de familia de unidad (g → u) sobre un insumo existente', async () => {
    const uc = TestBed.inject(SaveSupply);
    const { id } = await uc.execute({ name: 'Harina', purchasePrice: aPurchase('g', 5) });

    await expect(
      uc.execute({ id, name: 'Harina', purchasePrice: aPurchase('u', 5) }),
    ).rejects.toThrow();
  });

  it('con un id que no existe → lo persiste con ese id', async () => {
    const { id } = await TestBed.inject(SaveSupply).execute({
      id: 'IN-NUEVO',
      name: 'Harina',
      purchasePrice: aPurchase('g', 5),
    });

    expect(id).toBe('IN-NUEVO');
    expect((await TestBed.inject(SupplyRepository).byId(new EntityId('IN-NUEVO')))?.name).toBe(
      'Harina',
    );
  });
});
