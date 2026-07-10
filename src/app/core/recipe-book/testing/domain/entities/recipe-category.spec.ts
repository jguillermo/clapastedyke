import { EntityId } from '../../../../_common/entity-id';
import { RecipeCategory } from '../../../domain/entities/recipe-category';

describe('RecipeCategory', () => {
  it('trims the name on create', () => {
    const category = RecipeCategory.create(new EntityId('cat-1'), '  Queques  ');
    expect(category.name).toBe('Queques');
  });

  it('rejects an empty name', () => {
    expect(() => RecipeCategory.create(new EntityId('cat-1'), '   ')).toThrow();
  });

  it('equals by identity', () => {
    const a = RecipeCategory.create(new EntityId('cat-1'), 'Queques');
    const b = RecipeCategory.create(new EntityId('cat-1'), 'Otro nombre');
    const c = RecipeCategory.create(new EntityId('cat-2'), 'Queques');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
