import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { Supply } from '../../domain/entities/supply';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { SupplyMapper } from '../../infrastructure/supply/supply.mapper';

describe('SupplyMapper', () => {
  it('round-trips an ingredient (with usage and purchase price) through its record', () => {
    const original = Supply.create(
      new EntityId('IN-1'),
      'Harina',
      'g',
      'recipe',
      PurchasePrice.of(5, Quantity.of(1000, 'g')),
    );
    const restored = SupplyMapper.toDomain(SupplyMapper.toRecord(original));

    expect(restored.equals(original)).toBe(true);
    expect(restored.name).toBe('Harina');
    expect(restored.baseUnit).toBe('g');
    expect(restored.usage).toBe('recipe');
    expect(restored.purchasePrice.amount).toBe(5);
    expect(restored.purchasePrice.per.value).toBe(1000);
  });

  it('no inventa la hora de guardado: la estampa el repositorio', () => {
    // Si el mapper la escribiera con el valor que trae el agregado, guardar algo recién leído
    // conservaría la fecha vieja y la sincronización creería que no ha cambiado.
    const record = SupplyMapper.toRecord(
      Supply.create(
        new EntityId('IN-1'),
        'Harina',
        'g',
        'recipe',
        PurchasePrice.of(5, Quantity.of(1000, 'g')),
      ),
    );

    expect(record).not.toHaveProperty('updatedAt');
    expect(record).not.toHaveProperty('deletedAt');
  });

  it('trae la hora de guardado del documento al agregado', () => {
    const restored = SupplyMapper.toDomain({
      id: 'IN-1',
      name: 'Harina',
      baseUnit: 'g',
      usage: 'recipe',
      purchasePrice: { amount: 5, per: { value: 1000, unit: 'g' }, currency: 'PEN' },
      updatedAt: '2026-08-04T10:00:00.000Z',
    });

    expect(restored.updatedAt).toBe('2026-08-04T10:00:00.000Z');
  });

  it('un documento anterior al campo se lee sin fecha, no se rompe', () => {
    const restored = SupplyMapper.toDomain({
      id: 'IN-1',
      name: 'Harina',
      baseUnit: 'g',
      usage: 'recipe',
      purchasePrice: { amount: 5, per: { value: 1000, unit: 'g' }, currency: 'PEN' },
    });

    expect(restored.updatedAt).toBeNull();
  });
});
