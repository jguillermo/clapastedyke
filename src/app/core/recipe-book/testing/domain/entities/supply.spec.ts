import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { Supply } from '../../../domain/entities/supply';
import { PurchasePrice } from '../../../domain/value-objects/purchase-price';

const price = (amount: number) => PurchasePrice.of(amount, Quantity.of(1000, 'g'));
const countPrice = (amount: number, per = 30) => PurchasePrice.of(amount, Quantity.of(per, 'u'));

describe('Supply', () => {
  it('create sets the initial purchase price', () => {
    const supply = Supply.create(new EntityId('IN-1'), 'Harina', 'g', 'recipe', price(5));

    expect(supply.name).toBe('Harina');
    expect(supply.usage).toBe('recipe');
    expect(supply.purchasePrice.amount).toBe(5);
  });

  it('create recorta el nombre y graba un SupplySaved con el estado COMPLETO', () => {
    const supply = Supply.create(
      new EntityId('IN-1'),
      '  Harina sin gluten  ',
      'g',
      'recipe',
      price(5),
    );

    expect(supply.name).toBe('Harina sin gluten');
    const events = supply.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('SupplySaved');
    expect(events[0].aggregateId).toBe('IN-1'); // el id va aquí, no dentro del payload
    expect(events[0].data).toEqual({
      name: 'Harina sin gluten',
      baseUnit: 'g',
      usage: 'recipe',
      purchasePrice: { amount: 5, currency: 'PEN', per: { value: 1000, unit: 'g' } },
    });
  });

  it('pullEvents empties the queue: the event is published exactly once', () => {
    const supply = Supply.create(new EntityId('IN-1'), 'Harina', 'g', 'recipe', price(5));

    expect(supply.pullEvents()).toHaveLength(1);
    expect(supply.pullEvents()).toEqual([]);
  });

  it('restore rehydrates from storage WITHOUT recording anything (reading is not saving)', () => {
    const supply = Supply.restore({
      id: new EntityId('IN-1'),
      name: 'Harina',
      baseUnit: 'g',
      usage: 'recipe',
      purchasePrice: price(5),
    });

    expect(supply.purchasePrice.amount).toBe(5);
    expect(supply.pullEvents()).toEqual([]);
  });

  it('create rejects an empty name', () => {
    expect(() => Supply.create(new EntityId('IN-1'), '   ', 'g', 'recipe', price(5))).toThrow(
      'Supply name is required',
    );
  });

  it('equals by id', () => {
    const a = Supply.create(new EntityId('IN-1'), 'Harina', 'g', 'recipe', price(5));
    const b = Supply.create(new EntityId('IN-1'), 'Otra', 'g', 'topper', price(9));
    expect(a.equals(b)).toBe(true);
  });

  it('create rejects a base unit that does not match the purchase presentation unit', () => {
    // insumo por conteo con precio en gramos → inconsistente
    expect(() => Supply.create(new EntityId('IN-1'), 'Huevos', 'u', 'recipe', price(5))).toThrow();
    // la combinación consistente (conteo con presentación en `u`) sí funciona
    expect(() =>
      Supply.create(new EntityId('IN-2'), 'Huevos', 'u', 'recipe', countPrice(12)),
    ).not.toThrow();
  });

  it('re-tarifar es armarlo de nuevo sobre la misma unidad base: otra familia se rechaza', () => {
    // Es la invariante que protegía `repricedTo`: pasando el baseUnit del insumo que ya estaba,
    // `create` sigue impidiendo que un insumo por conteo pase a medirse en gramos.
    const eggs = Supply.create(new EntityId('IN-1'), 'Huevos', 'u', 'recipe', countPrice(12));

    expect(() => Supply.create(eggs.id, eggs.name, eggs.baseUnit, eggs.usage, price(5))).toThrow();
    expect(() =>
      Supply.create(eggs.id, eggs.name, eggs.baseUnit, eggs.usage, countPrice(15, 30)),
    ).not.toThrow();
  });
});
