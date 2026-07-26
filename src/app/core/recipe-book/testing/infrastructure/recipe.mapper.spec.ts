import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { Recipe } from '../../domain/entities/recipe';
import { SupplyLine } from '../../domain/value-objects/supply-line';
import { RecipeMapper } from '../../infrastructure/recipe/recipe.mapper';

describe('RecipeMapper', () => {
  it('round-trips a recipe with its lines', () => {
    const recipe = Recipe.create(
      new EntityId('RE-1'),
      new EntityId('cat-1'),
      'Vainilla',
      [
        SupplyLine.of(new EntityId('IN-1'), Quantity.of(250, 'g')),
        SupplyLine.of(new EntityId('IN-2'), Quantity.of(3, 'u')),
      ],
    );

    const back = RecipeMapper.toDomain(RecipeMapper.toRecord(recipe));

    expect(back.id.value).toBe('RE-1');
    expect(back.categoryId.value).toBe('cat-1');
    expect(back.name).toBe('Vainilla');
    expect(back.lines).toHaveLength(2);
    expect(back.lines[0].quantity.value).toBe(250);
    expect(back.lines[1].quantity.unit).toBe('u');
  });
});
