import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { Recipe } from '../../../domain/entities/recipe';
import { IngredientLine } from '../../../domain/value-objects/ingredient-line';
import { RecipePropertyValue } from '../../../domain/value-objects/recipe-property-value';

const line = IngredientLine.of(new EntityId('IN-1'), Quantity.of(250, 'g'));
const make = (name: string, values = [RecipePropertyValue.of('peso', 'weight', Quantity.of(1000, 'g'))], lines = [line]) =>
  Recipe.create(new EntityId('RE-1'), new EntityId('cat-1'), name, values, lines);

describe('Recipe', () => {
  it('requires a name and at least one ingredient line', () => {
    expect(() => make('  ')).toThrow();
    expect(() => make('Vainilla', [], [])).toThrow();
  });

  it('rejects duplicate property values', () => {
    const v = RecipePropertyValue.of('peso', 'weight', Quantity.of(1000, 'g'));
    expect(() => make('Vainilla', [v, v])).toThrow();
  });

  it('exposes a property value and its scaling weight', () => {
    const recipe = make('Vainilla');
    expect(recipe.valueOf('peso')?.asWeight().value).toBe(1000);
    expect(recipe.weightFor('peso')?.value).toBe(1000);
    expect(recipe.weightFor('nope')).toBeUndefined();
  });

  it('trims the name', () => {
    expect(make('  Vainilla  ').name).toBe('Vainilla');
  });
});
