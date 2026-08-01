import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../../_common/entity-id';
import { EventBus } from '../../../../_common/eventbus/event-bus';
import {
  makeCapacity,
  makeFlavor,
  makeRecipeBookFakes,
  makeSupply,
  RecordingEventBus,
} from '../../recipe-book-test-doubles';
import { RecipeRepository } from '../../../domain/repositories/recipe.repository';
import { SupplyRepository } from '../../../domain/repositories/supply.repository';
import { RecipeFlavorRepository } from '../../../domain/repositories/recipe-flavor.repository';
import { RecipeCapacityRepository } from '../../../domain/repositories/recipe-capacity.repository';
import { SaveRecipe } from '../../../application/use-cases/save-recipe.use-case';

/** Catálogo de partida: un insumo, un sabor y una capacidad que las recetas puedan referenciar. */
async function seedCatalog(): Promise<void> {
  await TestBed.inject(SupplyRepository).save(makeSupply('IN-1', 'Harina'));
  await TestBed.inject(RecipeFlavorRepository).save(makeFlavor('FL-1', 'Vainilla'));
  await TestBed.inject(RecipeCapacityRepository).save(makeCapacity('RC-1', 'mold', 'Doble', 2));
}

describe('SaveRecipe', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
    await seedCatalog();
  });

  it('sin id → persiste la receta y publica un solo RecipeSaved', async () => {
    const { id } = await TestBed.inject(SaveRecipe).execute({
      categoryId: 'CAT-1',
      name: 'Bizcocho',
      ingredients: [{ supplyId: 'IN-1', quantity: 500 }],
    });

    const saved = await TestBed.inject(RecipeRepository).byId(new EntityId(id));
    expect(saved?.name).toBe('Bizcocho');
    expect(saved?.ingredients).toHaveLength(1);
    expect(saved?.ingredients[0].quantity.unit).toBe('g'); // la unidad la aporta el insumo

    const bus = TestBed.inject(EventBus) as RecordingEventBus;
    expect(bus.published).toHaveLength(1);
    expect(bus.published[0].name).toBe('RecipeSaved');
    expect(bus.published[0].aggregateId).toBe(id);
    expect(bus.published[0].data['categoryId']).toBe('CAT-1');
  });

  it('con id existente → misma identidad, datos nuevos y OTRA VEZ un solo RecipeSaved', async () => {
    // El corazón de «no hay crear ni actualizar»: el segundo guardado es indistinguible del primero.
    const uc = TestBed.inject(SaveRecipe);
    const repo = TestBed.inject(RecipeRepository);
    const { id } = await uc.execute({
      categoryId: 'CAT-1',
      name: 'Bizcocho',
      ingredients: [{ supplyId: 'IN-1', quantity: 500 }],
    });
    const bus = TestBed.inject(EventBus) as RecordingEventBus;
    bus.published.length = 0;

    await uc.execute({
      id,
      categoryId: 'CAT-1',
      name: 'Bizcocho de vainilla',
      ingredients: [{ supplyId: 'IN-1', quantity: 750 }],
      flavorId: 'FL-1',
      moldCapacityId: 'RC-1',
    });

    const updated = await repo.byId(new EntityId(id));
    expect(updated?.name).toBe('Bizcocho de vainilla');
    expect(updated?.ingredients[0].quantity.value).toBe(750);
    expect(updated?.flavorId?.value).toBe('FL-1');
    expect(updated?.moldCapacityId?.value).toBe('RC-1');
    expect(await repo.all()).toHaveLength(1); // no duplicó: es la misma identidad

    expect(bus.published.map((e) => e.name)).toEqual(['RecipeSaved']);
  });

  it('con un id que no existe → lo persiste con ese id, como cualquier otro guardado', async () => {
    const { id } = await TestBed.inject(SaveRecipe).execute({
      id: 'RE-NUEVA',
      categoryId: 'CAT-1',
      name: 'Bizcocho',
      ingredients: [{ supplyId: 'IN-1', quantity: 500 }],
    });

    expect(id).toBe('RE-NUEVA');
    expect((await TestBed.inject(RecipeRepository).byId(new EntityId('RE-NUEVA')))?.name).toBe(
      'Bizcocho',
    );
  });

  it('leer del repositorio NO publica nada (la rehidratación es muda)', async () => {
    const repo = TestBed.inject(RecipeRepository);
    const bus = TestBed.inject(EventBus) as RecordingEventBus;
    const { id } = await TestBed.inject(SaveRecipe).execute({
      categoryId: 'CAT-1',
      name: 'Bizcocho',
      ingredients: [{ supplyId: 'IN-1', quantity: 500 }],
    });
    bus.published.length = 0;

    await repo.byId(new EntityId(id));
    await repo.byCategory(new EntityId('CAT-1'));
    await repo.all();

    expect(bus.published).toEqual([]);
  });

  it('rechaza un insumo que no existe', async () => {
    await expect(
      TestBed.inject(SaveRecipe).execute({
        categoryId: 'CAT-1',
        name: 'Bizcocho',
        ingredients: [{ supplyId: 'IN-FANTASMA', quantity: 500 }],
      }),
    ).rejects.toThrow('Supply IN-FANTASMA does not exist');
  });

  it('rechaza un sabor que no existe', async () => {
    await expect(
      TestBed.inject(SaveRecipe).execute({
        categoryId: 'CAT-1',
        name: 'Bizcocho',
        ingredients: [{ supplyId: 'IN-1', quantity: 500 }],
        flavorId: 'FL-FANTASMA',
      }),
    ).rejects.toThrow('Flavor FL-FANTASMA does not exist');
  });

  it('rechaza una capacidad que no existe', async () => {
    await expect(
      TestBed.inject(SaveRecipe).execute({
        categoryId: 'CAT-1',
        name: 'Bizcocho',
        ingredients: [{ supplyId: 'IN-1', quantity: 500 }],
        portionsCapacityId: 'RC-FANTASMA',
      }),
    ).rejects.toThrow('Capacity RC-FANTASMA does not exist');
  });

  it('una receta sin ingredientes no se guarda ni publica (invariante del dominio)', async () => {
    const bus = TestBed.inject(EventBus) as RecordingEventBus;

    await expect(
      TestBed.inject(SaveRecipe).execute({ categoryId: 'CAT-1', name: 'Vacía', ingredients: [] }),
    ).rejects.toThrow('Recipe needs at least one ingredient');

    expect(await TestBed.inject(RecipeRepository).all()).toEqual([]);
    expect(bus.published).toEqual([]);
  });
});
