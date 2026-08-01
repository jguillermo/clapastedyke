import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { Recipe } from '../../../domain/entities/recipe';
import { RecipeIngredient } from '../../../domain/value-objects/recipe-ingredient';

const anIngredient = (supplyId = 'IN-1', grams = 500) =>
  RecipeIngredient.of(new EntityId(supplyId), Quantity.of(grams, 'g'));

const aRecipe = (name = 'Bizcocho', ingredients: RecipeIngredient[] = [anIngredient()]) =>
  Recipe.create(new EntityId('RE-1'), new EntityId('CAT-1'), name, ingredients);

describe('Recipe', () => {
  it('create arma la receta con sus value objects y recorta el nombre', () => {
    const recipe = aRecipe('  Bizcocho  ');

    expect(recipe.name).toBe('Bizcocho');
    expect(recipe.categoryId.value).toBe('CAT-1');
    expect(recipe.ingredients).toHaveLength(1);
  });

  it('create graba UN solo RecipeSaved con el estado COMPLETO en primitivos', () => {
    const full = Recipe.create(
      new EntityId('RE-1'),
      new EntityId('CAT-1'),
      'Bizcocho',
      [anIngredient('IN-1', 500), anIngredient('IN-2', 250)],
      new EntityId('FL-1'),
      new EntityId('RC-1'),
      new EntityId('RC-2'),
    );

    const events = full.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('RecipeSaved');
    expect(events[0].aggregateId).toBe('RE-1'); // el id va aquí, no dentro del payload
    expect(events[0].data).toEqual({
      categoryId: 'CAT-1',
      name: 'Bizcocho',
      ingredients: [
        { supplyId: 'IN-1', quantity: 500, unit: 'g' },
        { supplyId: 'IN-2', quantity: 250, unit: 'g' },
      ],
      flavorId: 'FL-1',
      portionsCapacityId: 'RC-1',
      moldCapacityId: 'RC-2',
    });
  });

  it('los campos opcionales viajan como null, no se omiten', () => {
    const events = aRecipe().pullEvents();

    expect(events[0].data).toMatchObject({
      flavorId: null,
      portionsCapacityId: null,
      moldCapacityId: null,
    });
  });

  it('pullEvents vacía la cola: el evento se publica exactamente una vez', () => {
    const recipe = aRecipe();

    expect(recipe.pullEvents()).toHaveLength(1);
    expect(recipe.pullEvents()).toEqual([]);
  });

  it('restore rehidrata SIN grabar nada (leer no es guardar)', () => {
    const recipe = Recipe.restore({
      id: new EntityId('RE-1'),
      categoryId: new EntityId('CAT-1'),
      name: 'Bizcocho',
      ingredients: [anIngredient()],
      flavorId: null,
      portionsCapacityId: null,
      moldCapacityId: null,
    });

    expect(recipe.name).toBe('Bizcocho');
    expect(recipe.pullEvents()).toEqual([]);
  });

  it('create exige nombre', () => {
    expect(() => aRecipe('   ')).toThrow('Recipe name is required');
  });

  it('create exige al menos un ingrediente', () => {
    expect(() => aRecipe('Bizcocho', [])).toThrow('Recipe needs at least one ingredient');
  });

  it('sabor y las dos capacidades coexisten y son opcionales', () => {
    const full = Recipe.create(
      new EntityId('RE-1'),
      new EntityId('CAT-1'),
      'Bizcocho',
      [anIngredient()],
      new EntityId('FL-1'),
      new EntityId('RC-1'),
      new EntityId('RC-2'),
    );

    expect(full.flavorId?.value).toBe('FL-1');
    expect(full.portionsCapacityId?.value).toBe('RC-1');
    expect(full.moldCapacityId?.value).toBe('RC-2');
    expect(aRecipe().flavorId).toBeNull();
  });

  it('equals by id', () => {
    const a = aRecipe('Bizcocho');
    const b = Recipe.create(new EntityId('RE-1'), new EntityId('CAT-9'), 'Otra', [anIngredient()]);
    expect(a.equals(b)).toBe(true);
  });
});
