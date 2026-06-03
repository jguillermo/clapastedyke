import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryEventBus } from '../../../shared/application/event-bus';
import { SaveCustomer } from '../../../catalog/application/save-customer/save-customer';
import { SaveSupply } from '../../../catalog/application/save-supply/save-supply';
import { SaveRecipe } from '../../../catalog/application/save-recipe/save-recipe';
import {
  MemoryCustomerRepository,
  MemorySupplyRepository,
  MemoryRecipeRepository,
} from '../../../catalog/infrastructure/memory-repositories';
import { MemorySettingsRepository } from '../../../settings/infrastructure/memory-settings-repository';
import { StockService } from '../../../inventory/domain/stock-service';
import { MemoryStockMovementRepository } from '../../../inventory/infrastructure/memory-repositories';
import { ApproveQuote } from '../../../sales/application/approve-quote/approve-quote';
import { SaveQuote } from '../../../sales/application/save-quote/save-quote';
import { StartProduction } from '../../../sales/application/start-production/start-production';
import {
  MemoryQuoteRepository,
  MemoryOrderRepository,
} from '../../../sales/infrastructure/memory-repositories';
import { GetDashboard } from './get-dashboard';

describe('GetDashboard (Home panel projection)', () => {
  let dashboard: GetDashboard;
  let seed: () => Promise<void>;

  beforeEach(() => {
    const customers = new MemoryCustomerRepository();
    const supplies = new MemorySupplyRepository();
    const recipes = new MemoryRecipeRepository();
    const settings = new MemorySettingsRepository();
    const quotes = new MemoryQuoteRepository();
    const orders = new MemoryOrderRepository();
    const movements = new MemoryStockMovementRepository();
    const bus = new InMemoryEventBus();
    const stock = new StockService(supplies, movements);

    dashboard = new GetDashboard(quotes, orders, supplies, settings);

    seed = async () => {
      const customerId = (await new SaveCustomer(customers, bus).execute({ name: 'María Quispe' })).id;
      const ss = new SaveSupply(supplies, bus);
      // Cocoa out of stock (red) and butter below minimum (yellow)
      await ss.execute({ name: 'Cacao en polvo', type: 'ingredient', baseUnit: 'g', presentationSize: 500, presentationPriceSoles: 20, initialStock: 0, minStock: 100 });
      await ss.execute({ name: 'Mantequilla', type: 'ingredient', baseUnit: 'g', presentationSize: 500, presentationPriceSoles: 10, initialStock: 180, minStock: 500 });
      const flourId = (
        await ss.execute({ name: 'Harina', type: 'ingredient', baseUnit: 'g', presentationSize: 1000, presentationPriceSoles: 5, initialStock: 9000, minStock: 100 })
      ).id;
      const recipeId = (
        await new SaveRecipe(recipes, supplies, bus).execute({
          name: 'Torta', baseType: 'people', baseServings: 10,
          ingredients: [{ supplyId: flourId, baseQuantity: 300 }],
        })
      ).id;

      const save = new SaveQuote(quotes, customers, recipes, supplies, settings, bus);
      const approve = new ApproveQuote(quotes, orders, supplies, stock, settings, bus);
      const produce = new StartProduction(orders, stock, bus);

      // Q1 pending (expires in 15 days → counts in pending but NOT in «expiring this week»)
      await save.execute({ customerId, recipeId, scalingMode: 'people', scalingValue: 10, packaging: [], margin: 30, applyIgv: false });
      // Q2 → approved → order to production (to deliver)
      const q2 = await save.execute({ customerId, recipeId, scalingMode: 'people', scalingValue: 10, packaging: [], margin: 30, applyIgv: false });
      const { orderId } = await approve.execute({ quoteId: q2.id });
      await produce.execute({ orderId });
    };
  });

  it('counts the day KPIs and builds the alerts with their data', async () => {
    await seed();
    const r = await dashboard.execute();

    const byKey = Object.fromEntries(r.kpis.map(k => [k.key, k.value]));
    expect(byKey['pendingQuotes']).toBe(1);
    expect(byKey['expiringThisWeek']).toBe(0); // expires in 15 days
    expect(byKey['pendingOrders']).toBe(0); // moved to production
    expect(byKey['toDeliver']).toBe(1);
    expect(byKey['suppliesInRed']).toBe(1); // cocoa

    const types = r.alerts.map(a => a.type);
    expect(types).toContain('outOfStock');
    expect(types).toContain('belowMinimum');
    expect(types).toContain('toDeliver');

    const outOfStock = r.alerts.find(a => a.type === 'outOfStock')!;
    expect(outOfStock.name).toBe('Cacao en polvo');
    expect(outOfStock.stock).toBe(0);
    expect(outOfStock.unit).toBe('g');
    expect(outOfStock.action).toBe('buy');
    expect(outOfStock.route).toBe('/system/purchases');

    const belowMinimum = r.alerts.find(a => a.type === 'belowMinimum')!;
    expect(belowMinimum.name).toBe('Mantequilla');
    expect(belowMinimum.stock).toBe(180);
    expect(belowMinimum.minStock).toBe(500);

    const toDeliver = r.alerts.find(a => a.type === 'toDeliver')!;
    expect(toDeliver.refId).toBe('PD-0001');
    expect(toDeliver.name).toBe('María Quispe');
    expect(toDeliver.action).toBe('view');
    expect(toDeliver.route).toBe('/system/orders');

    expect(r.longDate.length).toBeGreaterThan(8); // 'lunes 01 jun 2026'
  });

  it('with an empty database: KPIs at zero and no alerts', async () => {
    const r = await dashboard.execute();
    expect(r.kpis.every(k => k.value === 0)).toBe(true);
    expect(r.alerts).toHaveLength(0);
  });
});
