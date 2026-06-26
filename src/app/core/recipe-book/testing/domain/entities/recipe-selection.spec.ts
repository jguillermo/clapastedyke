import { EntityId } from '../../../../_common/entity-id';
import { RecipeSelection } from '../../../domain/entities/recipe-selection';

describe('RecipeSelection', () => {
  it('stores the recipe, the flavor label and the chosen options by id', () => {
    const selection = RecipeSelection.create(new EntityId('sel-1'), new EntityId('re-1'), {
      flavorLabel: 'Vainilla',
      portionsOptionId: new EntityId('co-portions-double'),
      moldOptionId: new EntityId('co-mold-large'),
    });
    expect(selection.recipeId.value).toBe('re-1');
    expect(selection.flavorLabel).toBe('Vainilla');
    expect(selection.portionsOptionId?.value).toBe('co-portions-double');
    expect(selection.moldOptionId?.value).toBe('co-mold-large');
  });

  it('allows a partial selection (only some dimensions chosen)', () => {
    const selection = RecipeSelection.create(new EntityId('sel-1'), new EntityId('re-1'), {
      moldOptionId: new EntityId('co-mold-large'),
    });
    expect(selection.flavorLabel).toBeUndefined();
    expect(selection.portionsOptionId).toBeUndefined();
    expect(selection.moldOptionId?.value).toBe('co-mold-large');
  });
});
