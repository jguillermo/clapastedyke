import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { Recipe } from '../../domain/entities/recipe';
import { IngredientLine } from '../../domain/value-objects/ingredient-line';
import { RecipePropertyValue } from '../../domain/value-objects/recipe-property-value';
import { RecipeMapper } from '../../infrastructure/recipe.mapper';

describe('RecipeMapper', () => {
  it('round-trips a recipe with typed property values and lines', () => {
    const recipe = Recipe.create(
      new EntityId('RE-1'),
      new EntityId('cat-1'),
      'Vainilla',
      [
        RecipePropertyValue.of('peso', 'weight', Quantity.of(1000, 'g')),
        RecipePropertyValue.of('sabor', 'text', 'Vainilla'),
        RecipePropertyValue.of('porciones', 'number', 8),
      ],
      [IngredientLine.of(new EntityId('IN-1'), Quantity.of(250, 'g'))],
    );

    const back = RecipeMapper.toDomain(RecipeMapper.toRecord(recipe));

    expect(back.id.value).toBe('RE-1');
    expect(back.categoryId.value).toBe('cat-1');
    expect(back.valueOf('peso')?.asWeight().value).toBe(1000);
    expect(back.valueOf('sabor')?.value).toBe('Vainilla');
    expect(back.valueOf('porciones')?.value).toBe(8);
    expect(back.lines).toHaveLength(1);
    expect(back.lines[0].quantity.value).toBe(250);
  });
});
