import { EntityId } from '../../../../_common/entity-id';
import { ConversionOption } from '../../../domain/entities/conversion-option';

describe('ConversionOption', () => {
  it('creates an option with its group, label and factor', () => {
    const option = ConversionOption.create(new EntityId('co-1'), 'mold', 'Molde grande', 2);
    expect(option.group).toBe('mold');
    expect(option.label).toBe('Molde grande');
    expect(option.factor).toBe(2);
  });

  it('rejects a non-positive factor', () => {
    expect(() => ConversionOption.create(new EntityId('co-1'), 'portions', 'Cero', 0)).toThrow();
    expect(() => ConversionOption.create(new EntityId('co-1'), 'portions', 'Negativo', -1)).toThrow();
  });

  it('rejects an empty label', () => {
    expect(() => ConversionOption.create(new EntityId('co-1'), 'portions', '  ', 1)).toThrow();
  });

  it('rejects an unknown group', () => {
    expect(() => ConversionOption.create(new EntityId('co-1'), 'size' as 'mold', 'X', 1)).toThrow();
  });
});
