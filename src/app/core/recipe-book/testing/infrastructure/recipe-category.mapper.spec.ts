import { EntityId } from '../../../_common/entity-id';
import { RecipeCategory } from '../../domain/entities/recipe-category';
import { RecipeCategoryMapper } from '../../infrastructure/recipe-category/recipe-category.mapper';

describe('RecipeCategoryMapper', () => {
  it('round-trips a category (id + name)', () => {
    const category = RecipeCategory.create(new EntityId('cat-1'), 'Queques');

    const back = RecipeCategoryMapper.toDomain(RecipeCategoryMapper.toRecord(category));

    expect(back.id.value).toBe('cat-1');
    expect(back.name).toBe('Queques');
  });
});
