import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { InMemoryEventBus } from '../business/shared/application/event-bus';
import { IndexedDbIdGenerator } from '../business/shared/infrastructure/indexeddb/indexeddb-id-generator';
// Catalog
import { SaveCustomer } from '../business/catalog/application/save-customer/save-customer';
import { ListCustomers } from '../business/catalog/application/list-customers/list-customers';
import { SaveSupplier } from '../business/catalog/application/save-supplier/save-supplier';
import { ListSuppliers } from '../business/catalog/application/list-suppliers/list-suppliers';
import { SaveSupply } from '../business/catalog/application/save-supply/save-supply';
import { ListSupplies } from '../business/catalog/application/list-supplies/list-supplies';
import { SaveRecipe } from '../business/catalog/application/save-recipe/save-recipe';
import { ListRecipes } from '../business/catalog/application/list-recipes/list-recipes';
import { SavePackagingRule } from '../business/catalog/application/save-packaging-rule/save-packaging-rule';
import { ListPackagingRules } from '../business/catalog/application/list-packaging-rules/list-packaging-rules';
import {
  IndexedDbCustomerRepository,
  IndexedDbPackagingRuleRepository,
  IndexedDbRecipeRepository,
  IndexedDbSupplierRepository,
  IndexedDbSupplyRepository,
} from '../business/catalog/infrastructure/indexeddb-repositories';
// Settings
import { GetSettings } from '../business/settings/application/get-settings/get-settings';
import { UpdateSettings } from '../business/settings/application/update-settings/update-settings';
import {
  IndexedDbSettingsRepository,
  SizesFromSettings,
} from '../business/settings/infrastructure/indexeddb-settings-repository';
// Inventory
import { StockService } from '../business/inventory/domain/stock-service';
import { RegisterPurchase } from '../business/inventory/application/register-purchase/register-purchase';
import {
  AdjustInventory,
  PreviewAdjustment,
} from '../business/inventory/application/adjust-inventory/adjust-inventory';
import {
  OrderShortages,
  SuppliesBelowMinimum,
} from '../business/inventory/application/shopping-list/shopping-list';
import { ListPurchases } from '../business/inventory/application/list-purchases/list-purchases';
import { ListStockMovements } from '../business/inventory/application/list-stock-movements/list-stock-movements';
import { RegisterInitialStock } from '../business/inventory/application/register-initial-stock/register-initial-stock';
import {
  IndexedDbPurchaseRepository,
  IndexedDbStockMovementRepository,
} from '../business/inventory/infrastructure/indexeddb-repositories';
// Sales
import { CalculateQuote } from '../business/sales/application/calculate-quote/calculate-quote';
import { SaveQuote } from '../business/sales/application/save-quote/save-quote';
import { ListQuotes } from '../business/sales/application/list-quotes/list-quotes';
import { RejectQuote } from '../business/sales/application/reject-quote/reject-quote';
import { ApproveQuote } from '../business/sales/application/approve-quote/approve-quote';
import { StartProduction } from '../business/sales/application/start-production/start-production';
import { MarkDelivered } from '../business/sales/application/mark-delivered/mark-delivered';
import { CancelOrder } from '../business/sales/application/cancel-order/cancel-order';
import { ListOrders } from '../business/sales/application/list-orders/list-orders';
import {
  IndexedDbOrderRepository,
  IndexedDbQuoteRepository,
  IndexedDbSaleRepository,
} from '../business/sales/infrastructure/indexeddb-repositories';
// Dashboard
import { GetDashboard } from '../business/dashboard/application/get-dashboard/get-dashboard';

/**
 * COMPOSITION ROOT of the Bakery Costing bounded context — the only place
 * where Angular knows the business. Wires the IndexedDB adapters (the web's
 * real persistence), the use cases and the event subscribers. The domain
 * (`business/`) stays 100% Angular-free.
 *
 * It also keeps the UI language in sync with business settings: Transloco
 * starts from the persisted setting and follows 'SettingsUpdated' events.
 */
@Injectable({ providedIn: 'root' })
export class Business {
  private readonly transloco = inject(TranslocoService);

  private readonly ids = new IndexedDbIdGenerator();
  readonly bus = new InMemoryEventBus();

  // Repositories (IndexedDB — the browser database 'bakery-costing')
  private readonly customers = new IndexedDbCustomerRepository(this.ids);
  private readonly suppliers = new IndexedDbSupplierRepository(this.ids);
  private readonly supplies = new IndexedDbSupplyRepository(this.ids);
  private readonly recipes = new IndexedDbRecipeRepository(this.ids);
  private readonly packagingRules = new IndexedDbPackagingRuleRepository(this.ids);
  private readonly settings = new IndexedDbSettingsRepository();
  private readonly quotes = new IndexedDbQuoteRepository(this.ids);
  private readonly orders = new IndexedDbOrderRepository(this.ids);
  private readonly salesRepo = new IndexedDbSaleRepository(this.ids);
  private readonly purchases = new IndexedDbPurchaseRepository(this.ids);
  private readonly stockMovements = new IndexedDbStockMovementRepository(this.ids);

  // Domain services
  private readonly stockService = new StockService(this.supplies, this.stockMovements);
  private readonly availableSizes = new SizesFromSettings(this.settings);

  // Use cases — catalog
  readonly saveCustomer = new SaveCustomer(this.customers, this.bus);
  readonly listCustomers = new ListCustomers(this.customers);
  readonly saveSupplier = new SaveSupplier(this.suppliers, this.bus);
  readonly listSuppliers = new ListSuppliers(this.suppliers);
  readonly saveSupply = new SaveSupply(this.supplies, this.bus);
  readonly listSupplies = new ListSupplies(this.supplies);
  readonly saveRecipe = new SaveRecipe(this.recipes, this.supplies, this.bus);
  readonly listRecipes = new ListRecipes(this.recipes);
  readonly savePackagingRule = new SavePackagingRule(
    this.packagingRules, this.recipes, this.supplies, this.availableSizes, this.bus,
  );
  readonly listPackagingRules = new ListPackagingRules(this.packagingRules);

  // Use cases — settings
  readonly getSettings = new GetSettings(this.settings);
  readonly updateSettings = new UpdateSettings(this.settings, this.bus);

  // Use cases — sales
  readonly calculateQuote = new CalculateQuote(this.recipes, this.supplies, this.settings);
  readonly saveQuote = new SaveQuote(
    this.quotes, this.customers, this.recipes, this.supplies, this.settings, this.bus,
  );
  readonly listQuotes = new ListQuotes(this.quotes);
  readonly rejectQuote = new RejectQuote(this.quotes, this.bus);
  readonly approveQuote = new ApproveQuote(
    this.quotes, this.orders, this.supplies, this.stockService, this.settings, this.bus,
  );
  readonly startProduction = new StartProduction(this.orders, this.stockService, this.bus);
  readonly markDelivered = new MarkDelivered(this.orders, this.quotes, this.salesRepo, this.bus);
  readonly cancelOrder = new CancelOrder(this.orders, this.stockMovements, this.stockService, this.bus);
  readonly listOrders = new ListOrders(this.orders);

  // Use cases — inventory
  readonly registerPurchase = new RegisterPurchase(
    this.purchases, this.supplies, this.suppliers, this.stockService, this.bus,
  );
  readonly adjustInventory = new AdjustInventory(
    this.supplies, this.settings, this.stockService, this.bus,
  );
  readonly previewAdjustment = new PreviewAdjustment(this.supplies, this.settings);
  readonly orderShortages = new OrderShortages(this.orders, this.supplies, this.suppliers);
  readonly suppliesBelowMinimum = new SuppliesBelowMinimum(this.supplies, this.suppliers);
  readonly listPurchases = new ListPurchases(this.purchases);
  readonly listStockMovements = new ListStockMovements(this.stockMovements);

  // Use cases — dashboard
  readonly getDashboard = new GetDashboard(this.quotes, this.orders, this.supplies, this.settings);

  constructor() {
    // Event subscribers
    const initialStock = new RegisterInitialStock(this.stockMovements);
    this.bus.subscribe('SupplyCreated', e => initialStock.handle(e));

    // UI language follows business settings (live switch, no reload)
    void this.syncLanguage();
    this.bus.subscribe('SettingsUpdated', () => this.syncLanguage());
  }

  private async syncLanguage(): Promise<void> {
    try {
      const settings = await this.settings.get();
      this.transloco.setActiveLang(settings.general.language);
    } catch {
      // IndexedDB unavailable (SSR/tests): keep the default language.
    }
  }
}
