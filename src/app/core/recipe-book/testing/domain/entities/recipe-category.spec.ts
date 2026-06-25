import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { RecipeCategory } from '../../../domain/entities/recipe-category';
import { RecipeProperty } from '../../../domain/value-objects/recipe-property';
import { RecipePropertyValue } from '../../../domain/value-objects/recipe-property-value';

const prop = (id: string, type: 'text' | 'number' | 'weight', required = false, locked = false, role?: 'scaling-weight') =>
  RecipeProperty.create(id, id, type, required, locked, role);

const category = (properties: RecipeProperty[], system = false) =>
  RecipeCategory.create(new EntityId('cat-1'), 'Queques', 0, properties, system);

describe('RecipeCategory', () => {
  it('rejects duplicate property ids', () => {
    expect(() => category([prop('a', 'text'), prop('a', 'number')])).toThrow();
  });

  it('rejects more than one scaling-weight property', () => {
    expect(() =>
      category([prop('w1', 'weight', true, true, 'scaling-weight'), prop('w2', 'weight', true, true, 'scaling-weight')]),
    ).toThrow();
  });

  it('redefine keeps locked properties (cannot remove nor make optional)', () => {
    const cat = category([prop('peso', 'weight', true, true, 'scaling-weight')], true);
    // quitar la propiedad bloqueada
    expect(() => cat.redefine('Queques', [])).toThrow();
    // volverla opcional
    expect(() => cat.redefine('Queques', [prop('peso', 'weight', false, true, 'scaling-weight')])).toThrow();
    // conservarla + añadir otra → ok
    const next = cat.redefine('Queques', [
      prop('peso', 'weight', true, true, 'scaling-weight'),
      prop('sabor', 'text'),
    ]);
    expect(next.properties).toHaveLength(2);
  });

  it('validateValues enforces required + type and rejects unknown properties', () => {
    const cat = category([prop('peso', 'weight', true), prop('sabor', 'text', false)]);
    const weight = RecipePropertyValue.of('peso', 'weight', Quantity.of(1000, 'g'));

    expect(() => cat.validateValues([])).toThrow(); // falta peso (obligatoria)
    expect(() => cat.validateValues([RecipePropertyValue.of('peso', 'text', 'x')])).toThrow(); // tipo
    expect(() => cat.validateValues([weight, RecipePropertyValue.of('zzz', 'text', 'x')])).toThrow(); // desconocida
    expect(() => cat.validateValues([weight])).not.toThrow();
  });

  it('weightProperty returns the scaling-weight property', () => {
    const cat = category([prop('peso', 'weight', true, true, 'scaling-weight'), prop('sabor', 'text')]);
    expect(cat.weightProperty()?.id).toBe('peso');
  });
});
