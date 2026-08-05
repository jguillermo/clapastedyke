import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../_common/entity-id';
import { ImportableData } from '../../../_common/import/importable-data';
import { RecipeCapacityRepository } from '../../domain/repositories/recipe-capacity.repository';
import { RecipeCategoryRepository } from '../../domain/repositories/recipe-category.repository';
import { RecipeFlavorRepository } from '../../domain/repositories/recipe-flavor.repository';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { SupplyRepository } from '../../domain/repositories/supply.repository';
import { RecipeBookImportableData } from '../../infrastructure/recipe-book-importable-data';
import { makeRecipeBookFakes, RecordingEventBus } from '../recipe-book-test-doubles';

/**
 * Lo que trae al recetario lo que viene de fuera.
 *
 * Dos cosas se prueban aquí antes que ninguna otra, porque su fallo no da error:
 *
 * 1. **Que no publique ningún evento.** Si publicara, el suscriptor de cambios encolaría una subida de
 *    lo que se acaba de bajar, y los dos lados se pisarían en bucle para siempre.
 * 2. **Que una fila imposible no tumbe el lote.** Si lanzara, el ciclo moriría; y como la celda mala
 *    seguiría en el destino, moriría igual para siempre y la convergencia se detendría del todo.
 */
describe('RecipeBookImportableData', () => {
  let importer: ImportableData;
  let bus: RecordingEventBus;
  let supplies: SupplyRepository;
  let recipes: RecipeRepository;
  let categories: RecipeCategoryRepository;
  let flavors: RecipeFlavorRepository;
  let capacities: RecipeCapacityRepository;

  const insumo = (id: string, over: Record<string, unknown> = {}) => ({
    id,
    name: 'Harina',
    baseUnit: 'g',
    usage: 'recipe',
    priceAmount: 5,
    pricePerValue: 1000,
    pricePerUnit: 'g',
    currency: 'PEN',
    ...over,
  });

  const receta = (id: string, over: Record<string, unknown> = {}) => ({
    id,
    name: 'Bizcocho',
    categoryId: 'cat-1',
    flavorId: '',
    portionsCapacityId: '',
    moldCapacityId: '',
    ...over,
  });

  const linea = (recipeId: string, supplyId: string, quantity: unknown = 200) => ({
    recipeId,
    supplyId,
    quantity,
    unit: 'g',
  });

  const empty = {
    categories: [],
    flavors: [],
    capacities: [],
    supplies: [],
    recipes: [],
    recipeLines: [],
  };

  beforeEach(() => {
    const fakes = makeRecipeBookFakes();
    TestBed.configureTestingModule({
      providers: [
        ...fakes.providers,
        { provide: ImportableData, useClass: RecipeBookImportableData },
      ],
    });
    bus = fakes.bus;
    importer = TestBed.inject(ImportableData);
    supplies = TestBed.inject(SupplyRepository);
    recipes = TestBed.inject(RecipeRepository);
    categories = TestBed.inject(RecipeCategoryRepository);
    flavors = TestBed.inject(RecipeFlavorRepository);
    capacities = TestBed.inject(RecipeCapacityRepository);
  });

  it('NO publica ningún evento: si lo hiciera, se subiría de vuelta lo que se acaba de bajar', async () => {
    await importer.apply({
      tables: {
        ...empty,
        categories: [{ id: 'cat-1', name: 'Queques' }],
        flavors: [{ id: 'flv-1', label: 'Vainilla' }],
        capacities: [{ id: 'rc-1', group: 'portions', label: '33', factor: 33 }],
        supplies: [insumo('ing-1')],
        recipes: [receta('rec-1')],
        recipeLines: [linea('rec-1', 'ing-1')],
      },
      deleted: [],
    });

    expect(bus.published).toEqual([]);
  });

  it('trae los cinco agregados y dice cuáles entraron', async () => {
    const outcome = await importer.apply({
      tables: {
        ...empty,
        categories: [{ id: 'cat-1', name: 'Queques' }],
        flavors: [{ id: 'flv-1', label: 'Vainilla' }],
        capacities: [{ id: 'rc-1', group: 'portions', label: '33', factor: 33 }],
        supplies: [insumo('ing-1')],
        recipes: [receta('rec-1', { flavorId: 'flv-1', portionsCapacityId: 'rc-1' })],
        recipeLines: [linea('rec-1', 'ing-1')],
      },
      deleted: [],
    });

    expect(outcome.rejected).toEqual([]);
    expect(outcome.applied.map((ref) => ref.aggregate)).toEqual([
      'category',
      'flavor',
      'capacity',
      'supply',
      'recipe',
    ]);
    expect((await categories.all()).length).toBe(1);
    expect((await flavors.all()).length).toBe(1);
    expect((await capacities.all()).length).toBe(1);
    expect((await supplies.all())[0]?.name).toBe('Harina');

    const recipe = await recipes.byId(new EntityId('rec-1'));
    expect(recipe?.ingredients.length).toBe(1);
    expect(recipe?.flavorId?.value).toBe('flv-1');
  });

  it('lee números que llegan como texto, y con coma decimal', async () => {
    // Una hoja devuelve unas celdas como número y otras como texto, y una persona teclea «2,50».
    const outcome = await importer.apply({
      tables: {
        ...empty,
        supplies: [insumo('ing-1', { priceAmount: '2,50', pricePerValue: '1000' })],
      },
      deleted: [],
    });

    expect(outcome.rejected).toEqual([]);
    expect((await supplies.all())[0]?.purchasePrice.amount).toBe(2.5);
  });

  describe('una fila imposible no tumba el lote', () => {
    it('rechaza la mala y aplica la buena', async () => {
      const outcome = await importer.apply({
        tables: {
          ...empty,
          supplies: [insumo('ing-malo', { priceAmount: 'gratis' }), insumo('ing-bueno')],
        },
        deleted: [],
      });

      expect(outcome.applied).toEqual([{ aggregate: 'supply', id: 'ing-bueno' }]);
      expect(outcome.rejected).toHaveLength(1);
      expect(outcome.rejected[0]?.ref).toEqual({ aggregate: 'supply', id: 'ing-malo' });
      expect(outcome.rejected[0]?.reason).toContain('no es un número');
      expect((await supplies.all()).map((s) => s.id.value)).toEqual(['ing-bueno']);
    });

    it.each([
      ['sin nombre', { name: '   ' }, 'necesita un nombre'],
      ['con una cantidad en cero', { pricePerValue: 0 }, 'finite positive'],
      ['con una unidad que no existe', { baseUnit: 'kg' }, 'tiene que ser'],
      ['con la unidad de compra distinta de la base', { pricePerUnit: 'u' }, 'no cuadran'],
      ['sin id', { id: '' }, 'EntityId'],
    ])('rechaza un insumo %s', async (_caso, over, motivo) => {
      const outcome = await importer.apply({
        tables: { ...empty, supplies: [insumo('ing-1', over)] },
        deleted: [],
      });

      expect(outcome.applied).toEqual([]);
      expect(outcome.rejected[0]?.reason).toContain(motivo);
    });

    it('rechaza una receta que se quedó sin ingredientes legibles', async () => {
      // El caso real: alguien borró a mano las líneas de la receta en la hoja. Una receta sin
      // ingredientes es un estado que la app no sabe pintar, así que no entra.
      const outcome = await importer.apply({
        tables: { ...empty, recipes: [receta('rec-1')], recipeLines: [] },
        deleted: [],
      });

      expect(outcome.rejected[0]?.reason).toContain('ningún ingrediente');
      expect(await recipes.byId(new EntityId('rec-1'))).toBeNull();
    });

    it('omite la línea de un insumo que no existe, sin rechazar la receta entera', async () => {
      const outcome = await importer.apply({
        tables: {
          ...empty,
          supplies: [insumo('ing-1')],
          recipes: [receta('rec-1')],
          recipeLines: [linea('rec-1', 'ing-1'), linea('rec-1', 'ing-fantasma')],
        },
        deleted: [],
      });

      expect(outcome.rejected).toEqual([]);
      expect((await recipes.byId(new EntityId('rec-1')))?.ingredients.length).toBe(1);
    });
  });

  it('la unidad de una línea la dicta el insumo, no la celda', async () => {
    // Una celda que dijera otra unidad daría un costo disparatado por regla de tres.
    await importer.apply({
      tables: {
        ...empty,
        supplies: [insumo('ing-1')],
        recipes: [receta('rec-1')],
        recipeLines: [{ ...linea('rec-1', 'ing-1'), unit: 'u' }],
      },
      deleted: [],
    });

    expect((await recipes.byId(new EntityId('rec-1')))?.ingredients[0]?.quantity.unit).toBe('g');
  });

  it('un uso en blanco no rechaza la fila: se le pone el normal', async () => {
    await importer.apply({
      tables: { ...empty, supplies: [insumo('ing-1', { usage: '' })] },
      deleted: [],
    });

    expect((await supplies.all())[0]?.usage).toBe('recipe');
  });

  it('borra lo que el destino dice que ya no está', async () => {
    await importer.apply({ tables: { ...empty, supplies: [insumo('ing-1')] }, deleted: [] });

    const outcome = await importer.apply({
      tables: empty,
      deleted: [{ aggregate: 'supply', id: 'ing-1' }],
    });

    expect(outcome.applied).toEqual([{ aggregate: 'supply', id: 'ing-1' }]);
    expect(await supplies.all()).toEqual([]);
  });

  it('un agregado que este contexto no tiene se rechaza, no revienta', async () => {
    const outcome = await importer.apply({
      tables: empty,
      deleted: [{ aggregate: 'inventado', id: 'x-1' }],
    });

    expect(outcome.rejected[0]?.reason).toContain('no tiene ningún');
  });
});
