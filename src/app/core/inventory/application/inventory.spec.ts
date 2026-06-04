import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryEventBus } from '../../_common/application/event-bus';
import { EventBusToken } from '../../_common/core.tokens';
import { ValidationError } from '../../_common/domain/errors';
import { EntityId } from '../../_common/domain/entity-id';
import { SUPPLY_REPOSITORY } from '../../catalog/domain/supply/supply-repository';
import { SUPPLIER_REPOSITORY } from '../../catalog/domain/supplier/supplier-repository';
import { SaveSupply } from '../../catalog/application/save-supply/save-supply';
import { SaveSupplier } from '../../catalog/application/save-supplier/save-supplier';
import {
  MemorySupplyRepository,
  MemorySupplierRepository,
} from '../../catalog/infrastructure/memory-repositories';
import { SETTINGS_REPOSITORY } from '../../settings/domain/settings-repository';
import { MemorySettingsRepository } from '../../settings/infrastructure/memory-settings-repository';
import { STOCK_MOVEMENT_REPOSITORY } from '../domain/stock-movement/stock-movement-repository';
import { PURCHASE_REPOSITORY } from '../domain/purchase/purchase-repository';
import {
  MemoryPurchaseRepository,
  MemoryStockMovementRepository,
} from '../infrastructure/memory-repositories';
import { AdjustInventory, PreviewAdjustment } from './adjust-inventory/adjust-inventory';
import { SuppliesBelowMinimum } from './shopping-list/shopping-list';
import { RegisterPurchase } from './register-purchase/register-purchase';

describe('Inventory (purchases and adjustments — manual scenario)', () => {
  let supplies: MemorySupplyRepository;
  let movements: MemoryStockMovementRepository;
  let purchases: MemoryPurchaseRepository;
  let settings: MemorySettingsRepository;
  let bus: InMemoryEventBus;
  let registerPurchase: RegisterPurchase;
  let adjust: AdjustInventory;
  let flourId: string;
  let boxId: string;
  let supplierId: string;

  beforeEach(async () => {
    supplies = new MemorySupplyRepository();
    movements = new MemoryStockMovementRepository();
    purchases = new MemoryPurchaseRepository();
    settings = new MemorySettingsRepository();
    const suppliers = new MemorySupplierRepository();
    bus = new InMemoryEventBus();

    TestBed.configureTestingModule({
      providers: [
        { provide: SUPPLY_REPOSITORY, useValue: supplies },
        { provide: SUPPLIER_REPOSITORY, useValue: suppliers },
        { provide: STOCK_MOVEMENT_REPOSITORY, useValue: movements },
        { provide: PURCHASE_REPOSITORY, useValue: purchases },
        { provide: SETTINGS_REPOSITORY, useValue: settings },
        { provide: EventBusToken, useValue: bus },
      ],
    });

    supplierId = (
      await TestBed.inject(SaveSupplier).execute({ name: 'Molinos SAC', whatsapp: '51999111222' })
    ).id;
    const ss = TestBed.inject(SaveSupply);
    flourId = (
      await ss.execute({
        name: 'Harina', type: 'ingredient', baseUnit: 'g',
        presentationSize: 1000, presentationPriceSoles: 5, minStock: 2000,
        recommendedSupplierId: supplierId,
      })
    ).id;
    boxId = (
      await ss.execute({
        name: 'Caja torta', type: 'packaging', baseUnit: 'u',
        presentationSize: 25, presentationPriceSoles: 25, initialStock: 50, minStock: 10,
      })
    ).id;

    registerPurchase = TestBed.inject(RegisterPurchase);
    adjust = TestBed.inject(AdjustInventory);
  });

  it('the manual purchase: 5 bags at 5.50 → stock +5000 g, price 0.0055, green light', async () => {
    const r = await registerPurchase.execute({
      supplierId,
      lines: [{ supplyId: flourId, receivedPresentations: 5, paidPresentationPriceSoles: 5.5 }],
    });
    expect(r.id).toBe('CMP-0001');

    const flour = await supplies.byId(EntityId.of(flourId));
    expect(flour?.stock).toBe(5000);
    expect(flour?.presentation.price.soles).toBe(5.5);
    expect(flour?.pricePerBaseUnit.soles).toBe(0.0055);
    expect(flour?.stockLight).toBe('green');

    const kardex = await movements.byReferenceAndType('CMP-0001', 'purchase');
    expect(kardex).toHaveLength(1);
    expect(kardex[0].quantity).toBe(5000);
    expect(kardex[0].resultingStock).toBe(5000);

    const purchase = await purchases.byId(EntityId.of('CMP-0001'));
    expect(purchase?.lines[0].baseUnitQuantity).toBe(5000);
    expect(purchase?.lines[0].pricePerBaseUnitSoles).toBe(0.0055);
  });

  it('the manual adjustment: waste of 5 boxes → stock 45, kardex with reason', async () => {
    const r = await adjust.execute({ supplyId: boxId, type: 'waste', quantity: 5, reason: 'they got damaged' });
    expect(r.resultingStock).toBe(45);
    expect(r.stockLight).toBe('green'); // 45 > 10

    const all = await movements.all();
    const adjustment = all.find(m => m.type === 'waste');
    expect(adjustment?.quantity).toBe(-5);
    expect(adjustment?.reason).toBe('they got damaged');
  });

  it('count keeps the sign; unknown types and zero quantity are rejected', async () => {
    const up = await adjust.execute({ supplyId: boxId, type: 'count', quantity: 3 });
    expect(up.resultingStock).toBe(53);
    const down = await adjust.execute({ supplyId: boxId, type: 'count', quantity: -8 });
    expect(down.resultingStock).toBe(45);
    await expect(adjust.execute({ supplyId: boxId, type: 'theft', quantity: 1 })).rejects.toThrow(ValidationError);
    await expect(adjust.execute({ supplyId: boxId, type: 'count', quantity: 0 })).rejects.toThrow(ValidationError);
  });

  it('preview persists nothing and anticipates the stock light', async () => {
    const preview = TestBed.inject(PreviewAdjustment);
    const r = await preview.execute({ supplyId: boxId, type: 'waste', quantity: 45 });
    expect(r.currentStock).toBe(50);
    expect(r.resultingStock).toBe(5);
    expect(r.stockLight).toBe('yellow'); // 5 ≤ 10
    expect((await supplies.byId(EntityId.of(boxId)))?.stock).toBe(50); // untouched
  });

  it('supplies below minimum build the shopping list', async () => {
    // Flour (stock 0 ≤ minimum 2000) comes out pre-checked; the box does not.
    const list = await TestBed.inject(SuppliesBelowMinimum).execute();
    expect(list.map(i => i.supplyName)).toEqual(['Harina']);
    expect(list[0].suggestedQuantity).toBe(2000);
  });
});
