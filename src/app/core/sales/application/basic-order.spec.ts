import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryEventBus } from '../../_common/application/event-bus';
import { EventBusToken } from '../../_common/core.tokens';
import { SALE_REPOSITORY } from '../domain/sale/sale-repository';
import { MemorySaleRepository } from '../infrastructure/memory-repositories';
import { BASIC_ORDER_REPOSITORY } from '../domain/basic-order/basic-order-repository';
import { MemoryBasicOrderRepository } from '../infrastructure/memory-basic-order-repository';
import { PlaceBasicOrder } from './place-basic-order/place-basic-order';
import { DeliverBasicOrder } from './deliver-basic-order/deliver-basic-order';

describe('BasicOrder (Fase 3: pedido básico)', () => {
  let bus: InMemoryEventBus;
  let sales: MemorySaleRepository;
  let events: string[];

  beforeEach(() => {
    bus = new InMemoryEventBus();
    sales = new MemorySaleRepository();
    events = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: BASIC_ORDER_REPOSITORY, useValue: new MemoryBasicOrderRepository() },
        { provide: SALE_REPOSITORY, useValue: sales },
        { provide: EventBusToken, useValue: bus },
      ],
    });
    for (const name of ['OrderCreated', 'OrderDelivered']) bus.subscribe(name, e => void events.push(e.name));
  });

  it('crea el pedido (OrderCreated) y al entregar registra la venta (OrderDelivered)', async () => {
    const { orderId } = await TestBed.inject(PlaceBasicOrder).execute({
      customerId: 'CL-0001',
      customerName: 'Ana Torres',
      recipeId: 'RC-0001',
      recipeName: 'Galletas',
      priceSoles: 25,
    });
    expect(orderId).toBe('PDB-0001');
    expect(events).toContain('OrderCreated');

    const { saleId } = await TestBed.inject(DeliverBasicOrder).execute({ orderId });
    expect(events).toContain('OrderDelivered');
    expect(saleId).toBe('VT-0001');

    const allSales = await sales.all();
    expect(allSales).toHaveLength(1);
    expect(allSales[0].amount.soles).toBe(25);
    expect(allSales[0].customerName).toBe('Ana Torres');
  });

  it('rechaza precio no positivo y doble entrega', async () => {
    await expect(
      TestBed.inject(PlaceBasicOrder).execute({
        customerId: 'CL-0001', customerName: 'Ana', recipeId: 'RC-0001', recipeName: 'Galletas', priceSoles: 0,
      }),
    ).rejects.toThrow();

    const { orderId } = await TestBed.inject(PlaceBasicOrder).execute({
      customerId: 'CL-0001', customerName: 'Ana', recipeId: 'RC-0001', recipeName: 'Galletas', priceSoles: 10,
    });
    await TestBed.inject(DeliverBasicOrder).execute({ orderId });
    await expect(TestBed.inject(DeliverBasicOrder).execute({ orderId })).rejects.toThrow();
  });
});
