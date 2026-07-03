import { EntityId } from '../../../../_common/entity-id';
import { Flavor } from '../../../domain/entities/flavor';

describe('Flavor', () => {
  it('trims the label on create', () => {
    const flavor = Flavor.create(new EntityId('flv-1'), '  Vainilla  ');
    expect(flavor.label).toBe('Vainilla');
  });

  it('rejects an empty label', () => {
    expect(() => Flavor.create(new EntityId('flv-1'), '   ')).toThrow();
  });

  it('relabels keeping the same identity', () => {
    const flavor = Flavor.create(new EntityId('flv-1'), 'Vainilla');
    const renamed = flavor.relabeledTo('Chocolate');
    expect(renamed.label).toBe('Chocolate');
    expect(renamed.id.equals(flavor.id)).toBe(true);
    expect(renamed.equals(flavor)).toBe(true);
  });
});
