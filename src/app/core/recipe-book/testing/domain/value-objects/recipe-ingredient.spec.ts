import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { RecipeIngredient } from '../../../domain/value-objects/recipe-ingredient';

describe('RecipeIngredient', () => {
  it('composes a supply id with a quantity', () => {
    const ingredient = RecipeIngredient.of(new EntityId('IN-1'), Quantity.of(250, 'g'));
    expect(ingredient.supplyId.value).toBe('IN-1');
    expect(ingredient.quantity.value).toBe(250);
  });

  it('rejects a non-positive quantity (via Quantity)', () => {
    expect(() => RecipeIngredient.of(new EntityId('IN-1'), Quantity.of(0, 'g'))).toThrow();
  });

  it('is equal by value', () => {
    const a = RecipeIngredient.of(new EntityId('IN-1'), Quantity.of(250, 'g'));
    const b = RecipeIngredient.of(new EntityId('IN-1'), Quantity.of(250, 'g'));
    expect(a.equals(b)).toBe(true);
    expect(a.equals(RecipeIngredient.of(new EntityId('IN-2'), Quantity.of(250, 'g')))).toBe(false);
  });
});
