import { EntityId } from '../../../../_common/entity-id';
import { RecipeCapacity } from '../../../domain/entities/recipe-capacity';

describe('RecipeCapacity', () => {
  it('creates an option with its group, label and factor', () => {
    const option = RecipeCapacity.create(new EntityId('co-1'), 'mold', 'Molde grande', 2);
    expect(option.group).toBe('mold');
    expect(option.label).toBe('Molde grande');
    expect(option.factor).toBe(2);
  });

  it('rejects a non-positive factor', () => {
    expect(() => RecipeCapacity.create(new EntityId('co-1'), 'portions', 'Cero', 0)).toThrow();
    expect(() => RecipeCapacity.create(new EntityId('co-1'), 'portions', 'Negativo', -1)).toThrow();
  });

  it('rejects an empty label', () => {
    expect(() => RecipeCapacity.create(new EntityId('co-1'), 'portions', '  ', 1)).toThrow();
  });

  it('rejects an unknown group', () => {
    expect(() => RecipeCapacity.create(new EntityId('co-1'), 'size' as 'mold', 'X', 1)).toThrow();
  });
});
