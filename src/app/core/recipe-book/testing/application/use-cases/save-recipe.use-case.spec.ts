import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../../_common/entity-id';
import { EventBus } from '../../../../_common/eventbus/event-bus';
import { makeRecipeBookFakes, RecordingEventBus } from '../../recipe-book-test-doubles';
import { RecipeRepository } from '../../../domain/repositories/recipe.repository';
import { SaveRecipe } from '../../../application/use-cases/save-recipe.use-case';

/** Una petición mínima válida; los ids llegan ya resueltos por quien llama. */
const aRequest = () => ({
  categoryId: 'CAT-1',
  name: 'Bizcocho',
  ingredients: [{ supplyId: 'IN-1', quantity: 500, unit: 'g' as const }],
});

describe('SaveRecipe', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
  });

  it('sin id → persiste la receta y publica un solo RecipeSaved', async () => {
    const { id } = await TestBed.inject(SaveRecipe).execute(aRequest());

    const saved = await TestBed.inject(RecipeRepository).byId(new EntityId(id));
    expect(saved?.name).toBe('Bizcocho');
    expect(saved?.ingredients).toHaveLength(1);
    expect(saved?.ingredients[0].supplyId.value).toBe('IN-1');
    expect(saved?.ingredients[0].quantity.unit).toBe('g'); // la unidad la manda quien llama

    const bus = TestBed.inject(EventBus) as RecordingEventBus;
    expect(bus.published).toHaveLength(1);
    expect(bus.published[0].name).toBe('RecipeSaved');
    expect(bus.published[0].aggregateId).toBe(id);
  });

  it('con id existente → misma identidad, datos nuevos y OTRA VEZ un solo RecipeSaved', async () => {
    // El corazón de «no hay crear ni actualizar»: el segundo guardado es indistinguible del primero.
    const uc = TestBed.inject(SaveRecipe);
    const repo = TestBed.inject(RecipeRepository);
    const { id } = await uc.execute(aRequest());
    const bus = TestBed.inject(EventBus) as RecordingEventBus;
    bus.published.length = 0;

    await uc.execute({
      ...aRequest(),
      id,
      name: 'Bizcocho de vainilla',
      ingredients: [{ supplyId: 'IN-1', quantity: 750, unit: 'g' }],
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

  it('no comprueba que los ids existan: son otros agregados, con su propio guardado', async () => {
    // Insumo, sabor y capacidad los guarda su propia pantalla; aquí llegan ya resueltos. Este use
    // case toca un solo repositorio, el suyo.
    const { id } = await TestBed.inject(SaveRecipe).execute({
      ...aRequest(),
      ingredients: [{ supplyId: 'IN-QUE-NADIE-COMPROBÓ', quantity: 500, unit: 'g' }],
      flavorId: 'FL-QUE-NADIE-COMPROBÓ',
    });

    const saved = await TestBed.inject(RecipeRepository).byId(new EntityId(id));
    expect(saved?.ingredients[0].supplyId.value).toBe('IN-QUE-NADIE-COMPROBÓ');
    expect(saved?.flavorId?.value).toBe('FL-QUE-NADIE-COMPROBÓ');
  });

  it('con un id que no existe → lo persiste con ese id, como cualquier otro guardado', async () => {
    const { id } = await TestBed.inject(SaveRecipe).execute({ ...aRequest(), id: 'RE-NUEVA' });

    expect(id).toBe('RE-NUEVA');
    expect((await TestBed.inject(RecipeRepository).byId(new EntityId('RE-NUEVA')))?.name).toBe(
      'Bizcocho',
    );
  });

  it('leer del repositorio NO publica nada (la rehidratación es muda)', async () => {
    const repo = TestBed.inject(RecipeRepository);
    const bus = TestBed.inject(EventBus) as RecordingEventBus;
    const { id } = await TestBed.inject(SaveRecipe).execute(aRequest());
    bus.published.length = 0;

    await repo.byId(new EntityId(id));
    await repo.byCategory(new EntityId('CAT-1'));
    await repo.all();

    expect(bus.published).toEqual([]);
  });

  it('una receta sin ingredientes no se guarda ni publica (invariante del dominio)', async () => {
    const bus = TestBed.inject(EventBus) as RecordingEventBus;

    await expect(
      TestBed.inject(SaveRecipe).execute({ ...aRequest(), ingredients: [] }),
    ).rejects.toThrow('La receta no tiene ningún ingrediente.');

    expect(await TestBed.inject(RecipeRepository).all()).toEqual([]);
    expect(bus.published).toEqual([]);
  });

  it('una receta sin nombre no se guarda ni publica (invariante del dominio)', async () => {
    await expect(TestBed.inject(SaveRecipe).execute({ ...aRequest(), name: '  ' })).rejects.toThrow(
      'La receta necesita un nombre.',
    );

    expect(await TestBed.inject(RecipeRepository).all()).toEqual([]);
  });
});
