import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { Recipe } from '../../../domain/entities/recipe';
import { SupplyLine } from '../../../domain/value-objects/supply-line';

const line = SupplyLine.of(new EntityId('IN-1'), Quantity.of(250, 'g'));
const make = (name: string, lines = [line]) =>
  Recipe.create(new EntityId('RE-1'), new EntityId('cat-1'), name, lines);

describe('Recipe', () => {
  it('requires a name and at least one ingredient line', () => {
    expect(() => make('  ')).toThrow();
    expect(() => make('Vainilla', [])).toThrow();
  });

  it('trims the name', () => {
    expect(make('  Vainilla  ').name).toBe('Vainilla');
  });

  it('adds a line through the root', () => {
    const extra = SupplyLine.of(new EntityId('IN-2'), Quantity.of(100, 'g'));
    const recipe = make('Vainilla').addLine(extra);
    expect(recipe.lines).toHaveLength(2);
  });

  it('equals by identity', () => {
    const a = make('Vainilla');
    const b = Recipe.create(new EntityId('RE-1'), new EntityId('cat-2'), 'Otra', [line]);
    const c = Recipe.create(new EntityId('RE-2'), new EntityId('cat-1'), 'Vainilla', [line]);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
