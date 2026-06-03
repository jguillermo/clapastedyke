import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryEventBus } from '../../_common/application/event-bus';
import { ValidationError } from '../../_common/domain/errors';
import { EntityId } from '../../_common/domain/entity-id';
import { SaveCustomer } from '../../catalog/application/save-customer/save-customer';
import { SaveSupply } from '../../catalog/application/save-supply/save-supply';
import { SaveRecipe } from '../../catalog/application/save-recipe/save-recipe';
import {
  MemoryCustomerRepository,
  MemorySupplyRepository,
  MemoryRecipeRepository,
} from '../../catalog/infrastructure/memory-repositories';
import { UpdateSettings } from '../../settings/application/update-settings/update-settings';
import { MemorySettingsRepository } from '../../settings/infrastructure/memory-settings-repository';
import { StockService } from '../../inventory/domain/stock-service';
import { MemoryStockMovementRepository } from '../../inventory/infrastructure/memory-repositories';
import { MemoryQuoteRepository } from '../infrastructure/memory-repositories';
import {
  MemoryOrderRepository,
  MemorySaleRepository,
} from '../infrastructure/memory-repositories';
import { ApproveQuote } from './approve-quote/approve-quote';
import { CancelOrder } from './cancel-order/cancel-order';
import { SaveQuote } from './save-quote/save-quote';
import { StartProduction } from './start-production/start-production';
import { MarkDelivered } from './mark-delivered/mark-delivered';

/**
 * THE manual cycle, end to end and with real stock:
 * quote 20 people → approve (PD- is born, stock goes down) → production →
 * deliver (VT- born with the frozen price) · and the cancellation branch.
 */
describe('Quote → order → sale cycle (use case integration)', () => {
  let supplies: MemorySupplyRepository;
  let movements: MemoryStockMovementRepository;
  let quotes: MemoryQuoteRepository;
  let orders: MemoryOrderRepository;
  let sales: MemorySaleRepository;
  let settings: MemorySettingsRepository;
  let bus: InMemoryEventBus;

  let saveQuote: SaveQuote;
  let approve: ApproveQuote;
  let produce: StartProduction;
  let deliver: MarkDelivered;
  let cancel: CancelOrder;

  let customerId: string;
  let recipeId: string;
  let flourId: string;
  let eggId: string;

  beforeEach(async () => {
    const customers = new MemoryCustomerRepository();
    supplies = new MemorySupplyRepository();
    const recipes = new MemoryRecipeRepository();
    settings = new MemorySettingsRepository();
    movements = new MemoryStockMovementRepository();
    quotes = new MemoryQuoteRepository();
    orders = new MemoryOrderRepository();
    sales = new MemorySaleRepository();
    bus = new InMemoryEventBus();
    const stock = new StockService(supplies, movements);

    customerId = (await new SaveCustomer(customers, bus).execute({ name: 'Ana Torres' })).id;
    const ss = new SaveSupply(supplies, bus);
    flourId = (
      await ss.execute({
        name: 'Flour', type: 'ingredient', baseUnit: 'g',
        presentationSize: 1000, presentationPriceSoles: 5, initialStock: 1000, minStock: 2000,
      })
    ).id;
    eggId = (
      await ss.execute({
        name: 'Egg', type: 'ingredient', baseUnit: 'u',
        presentationSize: 30, presentationPriceSoles: 15, initialStock: 30, minStock: 30,
      })
    ).id;
    recipeId = (
      await new SaveRecipe(recipes, supplies, bus).execute({
        name: 'Chocolate cake', baseType: 'people', baseServings: 10, laborHours: 2,
        ingredients: [
          { supplyId: flourId, baseQuantity: 300 },
          { supplyId: eggId, baseQuantity: 4 },
        ],
      })
    ).id;
    await new UpdateSettings(settings, bus).execute({ general: { defaultMargin: 30 } });

    saveQuote = new SaveQuote(quotes, customers, recipes, supplies, settings, bus);
    approve = new ApproveQuote(quotes, orders, supplies, stock, settings, bus);
    produce = new StartProduction(orders, stock, bus);
    deliver = new MarkDelivered(orders, quotes, sales, bus);
    cancel = new CancelOrder(orders, movements, stock, bus);
  });

  async function quoteTwentyPeople(): Promise<string> {
    return (
      await saveQuote.execute({
        customerId, recipeId, scalingMode: 'people', scalingValue: 20,
        packaging: [], margin: 30, applyIgv: true,
      })
    ).id;
  }

  it('approve creates the order with requirements/shortages and lowers stock (ON_APPROVAL moment)', async () => {
    const quoteId = await quoteTwentyPeople();
    const r = await approve.execute({ quoteId });

    expect(r.orderId).toBe('PD-0001');
    // Required: 600 g flour (1000 available → shortage 0) and 8 eggs (30 → 0)… but
    // the warning reports what will fall below zero; nothing is short yet.
    expect(r.shortages).toHaveLength(0);

    const quote = await quotes.byId(EntityId.of(quoteId));
    expect(quote?.status).toBe('Approved');
    expect(quote?.orderId?.value).toBe('PD-0001');

    // Stock already deducted (default settings: ON_APPROVAL)
    const flour = await supplies.byId(EntityId.of(flourId));
    expect(flour?.stock).toBe(400); // 1000 − 600
    const consumptions = await movements.byReferenceAndType('PD-0001', 'consumption');
    expect(consumptions).toHaveLength(2);

    // Double approval blocked by the aggregate
    await expect(approve.execute({ quoteId })).rejects.toThrow(ValidationError);
  });

  it('reports shortages when stock is not enough (warning, not a block)', async () => {
    const id1 = await quoteTwentyPeople();
    await approve.execute({ quoteId: id1 }); // flour ends at 400
    const id2 = await quoteTwentyPeople();
    const r = await approve.execute({ quoteId: id2 }); // needs 600, has 400

    expect(r.shortages.map(s => s.supplyName)).toEqual(['Flour']);
    expect(r.shortages[0].shortage).toBe(200);
    // Stock goes NEGATIVE: 400−600 = −200 (allowed, red light)
    const flour = await supplies.byId(EntityId.of(flourId));
    expect(flour?.stock).toBe(-200);
    expect(flour?.stockLight).toBe('red');
  });

  it('with ON_PRODUCTION moment stock goes down when production starts (idempotent)', async () => {
    await new UpdateSettings(settings, bus).execute({
      general: { stockDeductionMoment: 'ON_PRODUCTION' },
    });
    const quoteId = await quoteTwentyPeople();
    const { orderId } = await approve.execute({ quoteId });

    let flour = await supplies.byId(EntityId.of(flourId));
    expect(flour?.stock).toBe(1000); // still intact

    await produce.execute({ orderId });
    flour = await supplies.byId(EntityId.of(flourId));
    expect(flour?.stock).toBe(400); // went down on production, only once
  });

  it('deliver registers sale VT-0001 with the frozen final price (S/ 110)', async () => {
    const quoteId = await quoteTwentyPeople();
    const { orderId } = await approve.execute({ quoteId });
    await produce.execute({ orderId });

    const r = await deliver.execute({ orderId });
    expect(r.saleId).toBe('VT-0001');
    expect(r.amountSoles).toBe(110);

    const order = await orders.byId(EntityId.of(orderId));
    expect(order?.status).toBe('Delivered');
    expect(order?.deliveredAt).not.toBeNull();
    expect(await sales.all()).toHaveLength(1);

    // A Delivered order cannot be cancelled
    await expect(cancel.execute({ orderId })).rejects.toThrow(ValidationError);
  });

  it('cancel returns the full stock with cancellation movements', async () => {
    const quoteId = await quoteTwentyPeople();
    const { orderId } = await approve.execute({ quoteId });

    await cancel.execute({ orderId, reason: 'the customer backed out' });

    const order = await orders.byId(EntityId.of(orderId));
    expect(order?.status).toBe('Cancelled');
    expect(order?.cancellationReason).toBe('the customer backed out');

    const flour = await supplies.byId(EntityId.of(flourId));
    const egg = await supplies.byId(EntityId.of(eggId));
    expect(flour?.stock).toBe(1000); // returned
    expect(egg?.stock).toBe(30);
    expect(await movements.byReferenceAndType(orderId, 'cancellation')).toHaveLength(2);
  });
});
