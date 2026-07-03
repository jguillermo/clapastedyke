import { EntityId } from '../../../_common/entity-id';
import { RecipeCategory } from '../../domain/entities/recipe-category';
import { RecipeProperty } from '../../domain/value-objects/recipe-property';
import { RecipeCategoryMapper } from '../../infrastructure/recipe-category.mapper';

describe('RecipeCategoryMapper', () => {
  it('round-trips a category with its property schema', () => {
    const category = RecipeCategory.create(
      new EntityId('cat-1'),
      'Queques',
      0,
      [
        RecipeProperty.create('peso', 'Peso', 'weight', true, true, 'scaling-weight'),
        RecipeProperty.create('sabor', 'Sabor', 'text', false),
      ],
      true,
    );

    const back = RecipeCategoryMapper.toDomain(RecipeCategoryMapper.toRecord(category));

    expect(back.id.value).toBe('cat-1');
    expect(back.name).toBe('Queques');
    expect(back.system).toBe(true);
    expect(back.properties).toHaveLength(2);
    expect(back.weightProperty()?.id).toBe('peso');
    expect(back.property('sabor')?.type).toBe('text');
  });
});
