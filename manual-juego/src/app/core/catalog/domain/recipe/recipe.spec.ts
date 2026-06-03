import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { Recipe } from './recipe';

const id = EntityId.create('RC', 1);

describe('Recipe (aggregate)', () => {
  it('requires at least one ingredient with quantity > 0 (the GAS invariant)', () => {
    expect(() =>
      Recipe.create(id, {
        name: 'Torta chocolate',
        baseType: 'people',
        baseServings: 10,
        ingredients: [],
      }),
    ).toThrow(ValidationError);

    expect(() =>
      Recipe.create(id, {
        name: 'Torta chocolate',
        baseType: 'people',
        baseServings: 10,
        ingredients: [{ supplyId: 'IN-0001', baseQuantity: 0 }],
      }),
    ).toThrow(ValidationError);
  });

  it('filters out inert lines and keeps the active ones', () => {
    const recipe = Recipe.create(id, {
      name: 'Torta chocolate',
      category: 'tortas',
      baseType: 'people',
      baseServings: 10,
      laborHours: 2,
      ingredients: [
        { supplyId: 'IN-0001', baseQuantity: 300 },
        { supplyId: '', baseQuantity: 5 },
        { supplyId: 'IN-0002', baseQuantity: 4 },
      ],
    });
    expect(recipe.ingredients).toHaveLength(2);
    expect(recipe.pullEvents().map(e => e.name)).toEqual(['RecipeCreated']);
  });

  it('rejects an invalid base and negative time', () => {
    const base = {
      name: 'X',
      baseType: 'people' as const,
      ingredients: [{ supplyId: 'IN-0001', baseQuantity: 1 }],
    };
    expect(() => Recipe.create(id, { ...base, baseServings: 0 })).toThrow(ValidationError);
    expect(() =>
      Recipe.create(id, { ...base, baseServings: 10, laborHours: -1 }),
    ).toThrow(ValidationError);
  });

  it('round-trips through primitives without losing anything', () => {
    const recipe = Recipe.create(id, {
      name: 'Torta chocolate',
      baseType: 'size',
      baseServings: 8,
      laborHours: 1.5,
      ingredients: [{ supplyId: 'IN-0001', baseQuantity: 300 }],
    });
    const clone = Recipe.fromPrimitives(recipe.toPrimitives());
    expect(clone.name).toBe('Torta chocolate');
    expect(clone.baseServings).toBe(8);
    expect(clone.ingredients).toEqual(recipe.ingredients as never);
  });
});
