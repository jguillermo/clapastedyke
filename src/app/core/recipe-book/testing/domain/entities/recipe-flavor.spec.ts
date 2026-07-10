import { EntityId } from '../../../../_common/entity-id';
import { RecipeFlavor } from '../../../domain/entities/recipe-flavor';

describe('RecipeFlavor', () => {
  it('trims the label on create', () => {
    const flavor = RecipeFlavor.create(new EntityId('flv-1'), '  Vainilla  ');
    expect(flavor.label).toBe('Vainilla');
  });

  it('rejects an empty label', () => {
    expect(() => RecipeFlavor.create(new EntityId('flv-1'), '   ')).toThrow();
  });

  it('relabels keeping the same identity', () => {
    const flavor = RecipeFlavor.create(new EntityId('flv-1'), 'Vainilla');
    const renamed = flavor.relabeledTo('Chocolate');
    expect(renamed.label).toBe('Chocolate');
    expect(renamed.id.equals(flavor.id)).toBe(true);
    expect(renamed.equals(flavor)).toBe(true);
  });
});
