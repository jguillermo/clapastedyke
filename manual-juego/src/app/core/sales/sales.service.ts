import { Injectable, inject } from '@angular/core';
import { IdGeneratorToken, EventBusToken } from '../_common/core.tokens';
import { CatalogService } from '../catalog/catalog.service';
import { InventoryService } from '../inventory/inventory.service';
import { SettingsService } from '../settings/settings.service';
import {
  IndexedDbOrderRepository,
  IndexedDbQuoteRepository,
  IndexedDbSaleRepository,
} from './infrastructure/indexeddb-repositories';
import { CalculateQuote } from './application/calculate-quote/calculate-quote';
import { SaveQuote } from './application/save-quote/save-quote';
import { ListQuotes } from './application/list-quotes/list-quotes';
import { RejectQuote } from './application/reject-quote/reject-quote';
import { ApproveQuote } from './application/approve-quote/approve-quote';
import { StartProduction } from './application/start-production/start-production';
import { MarkDelivered } from './application/mark-delivered/mark-delivered';
import { CancelOrder } from './application/cancel-order/cancel-order';
import { ListOrders } from './application/list-orders/list-orders';
import { OrderShortages } from '../inventory/application/shopping-list/shopping-list';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly ids = inject(IdGeneratorToken);
  private readonly bus = inject(EventBusToken);
  private readonly catalog = inject(CatalogService);
  private readonly inventory = inject(InventoryService);
  private readonly settings = inject(SettingsService);

  // Repositories exposed for cross-context wiring (DashboardService)
  readonly quoteRepo = new IndexedDbQuoteRepository(this.ids);
  readonly orderRepo = new IndexedDbOrderRepository(this.ids);
  private readonly salesRepo = new IndexedDbSaleRepository(this.ids);

  readonly calculateQuote = new CalculateQuote(
    this.catalog.recipeRepo, this.catalog.supplyRepo, this.settings.settingsRepo,
  );
  readonly saveQuote = new SaveQuote(
    this.quoteRepo, this.catalog.customerRepo, this.catalog.recipeRepo,
    this.catalog.supplyRepo, this.settings.settingsRepo, this.bus,
  );
  readonly listQuotes = new ListQuotes(this.quoteRepo);
  readonly rejectQuote = new RejectQuote(this.quoteRepo, this.bus);
  readonly approveQuote = new ApproveQuote(
    this.quoteRepo, this.orderRepo, this.catalog.supplyRepo,
    this.inventory.stockService, this.settings.settingsRepo, this.bus,
  );
  readonly startProduction = new StartProduction(this.orderRepo, this.inventory.stockService, this.bus);
  readonly markDelivered = new MarkDelivered(this.orderRepo, this.quoteRepo, this.salesRepo, this.bus);
  readonly cancelOrder = new CancelOrder(
    this.orderRepo, this.inventory.stockMovementRepo, this.inventory.stockService, this.bus,
  );
  readonly listOrders = new ListOrders(this.orderRepo);
  readonly orderShortages = new OrderShortages(
    this.orderRepo, this.catalog.supplyRepo, this.catalog.supplierRepo,
  );
}
