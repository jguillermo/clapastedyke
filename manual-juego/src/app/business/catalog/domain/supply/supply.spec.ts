import { describe, expect, it } from 'vitest';
import { Money } from '../../../shared/domain/money';
import { EntityId } from '../../../shared/domain/entity-id';
import { Supply } from './supply';

function flour(initialStock = 0, minStock = 2000): Supply {
  return Supply.create(EntityId.create('IN', 1), {
    name: 'Harina',
    type: 'ingredient',
    baseUnit: 'g',
    presentationSize: 1000,
    presentationPrice: Money.fromSoles(5),
    initialStock,
    minStock,
  });
}

describe('Supply (aggregate)', () => {
  it('derives the price per base unit (S/5 ÷ 1000 g = 0.005)', () => {
    expect(flour().pricePerBaseUnit.soles).toBe(0.005);
  });

  it('stock light: red ≤ 0, yellow ≤ minimum, green the rest', () => {
    expect(flour(0).stockLight).toBe('red');
    expect(flour(1500, 2000).stockLight).toBe('yellow');
    expect(flour(5000, 2000).stockLight).toBe('green');
  });

  it('consuming may leave negative stock (approving with shortages warns, does not block)', () => {
    const supply = flour(100);
    supply.consumeStock(600);
    expect(supply.stock).toBe(-500);
    expect(supply.stockLight).toBe('red');
  });

  it('a purchase raises stock and replaces the presentation price', () => {
    const supply = flour(0);
    supply.receiveStock(5000); // 5 bags of 1000 g
    supply.updatePresentationPrice(Money.fromSoles(5.5));
    expect(supply.stock).toBe(5000);
    expect(supply.pricePerBaseUnit.soles).toBe(0.0055);
    expect(supply.stockLight).toBe('green');
  });

  it('emits SupplyCreated with the initial stock (INVENTORY will record the movement)', () => {
    const events = flour(50).pullEvents();
    expect(events[0].name).toBe('SupplyCreated');
    expect(events[0].data['initialStock']).toBe(50);
  });
});
