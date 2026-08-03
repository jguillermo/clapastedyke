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

  it('create graba un solo FlavorSaved', () => {
    const events = RecipeFlavor.create(new EntityId('flv-1'), 'Vainilla').pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('FlavorSaved');
    expect(events[0].aggregateId).toBe('flv-1');
  });

  it('restore rehidrata sin grabar nada', () => {
    const flavor = RecipeFlavor.restore({ id: new EntityId('flv-1'), label: 'Vainilla' });
    expect(flavor.label).toBe('Vainilla');
    expect(flavor.pullEvents()).toEqual([]);
  });

  it('renombrar es armarlo con el label nuevo sobre la misma identidad', () => {
    const flavor = RecipeFlavor.create(new EntityId('flv-1'), 'Vainilla');
    const renamed = RecipeFlavor.create(flavor.id, 'Chocolate');
    expect(renamed.label).toBe('Chocolate');
    expect(renamed.id.equals(flavor.id)).toBe(true);
    expect(renamed.equals(flavor)).toBe(true);
  });
});
