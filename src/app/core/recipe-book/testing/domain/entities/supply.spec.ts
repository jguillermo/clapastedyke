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

  it('restore rehydrates from storage', () => {
    const supply = Supply.restore({
      id: new EntityId('IN-1'),
      name: 'Harina',
      baseUnit: 'g',
      usage: 'recipe',
      purchasePrice: price(5),
    });
    expect(supply.purchasePrice.amount).toBe(5);
  });

  it('repricedTo returns a new instance and leaves the original unchanged', () => {
    const original = Supply.restore({
      id: new EntityId('IN-1'),
      name: 'Harina',
      baseUnit: 'g',
      usage: 'recipe',
      purchasePrice: price(5),
    });
    const updated = original.repricedTo(price(8));

    expect(updated).not.toBe(original);
    expect(updated.purchasePrice.amount).toBe(8);
    expect(original.purchasePrice.amount).toBe(5); // inmutable
  });

  it('renamedTo returns a new instance with the new name, same identity', () => {
    const original = Supply.restore({
      id: new EntityId('IN-1'),
      name: 'Harina',
      baseUnit: 'g',
      usage: 'recipe',
      purchasePrice: price(5),
    });
    const renamed = original.renamedTo('  Harina sin gluten  ');

    expect(renamed).not.toBe(original);
    expect(renamed.name).toBe('Harina sin gluten'); // sin espacios sobrantes
    expect(original.name).toBe('Harina'); // inmutable
    expect(renamed.id.equals(original.id)).toBe(true);
    expect(renamed.purchasePrice.amount).toBe(5);
  });

  it('renamedTo rejects an empty name', () => {
    const supply = Supply.create(new EntityId('IN-1'), 'Harina', 'g', 'recipe', price(5));
    expect(() => supply.renamedTo('   ')).toThrow('Supply name is required');
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

  it('repricedTo rejects a price in a different unit family', () => {
    const eggs = Supply.create(new EntityId('IN-1'), 'Huevos', 'u', 'recipe', countPrice(12));
    expect(() => eggs.repricedTo(price(5))).toThrow(); // precio en `g` sobre un insumo `u`
    expect(() => eggs.repricedTo(countPrice(15, 30))).not.toThrow();
  });
});
