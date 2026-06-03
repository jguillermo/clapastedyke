import { Injectable, inject } from '@angular/core';
import { IdGeneratorToken, EventBusToken } from '../_common/core.tokens';
import { CatalogService } from '../catalog/catalog.service';
import { SettingsService } from '../settings/settings.service';
import {
  IndexedDbPurchaseRepository,
  IndexedDbStockMovementRepository,
} from './infrastructure/indexeddb-repositories';
import { StockService } from './domain/stock-service';
import { RegisterPurchase } from './application/register-purchase/register-purchase';
import { AdjustInventory, PreviewAdjustment } from './application/adjust-inventory/adjust-inventory';
import { SuppliesBelowMinimum } from './application/shopping-list/shopping-list';
import { ListPurchases } from './application/list-purchases/list-purchases';
import { ListStockMovements } from './application/list-stock-movements/list-stock-movements';
import { RegisterInitialStock } from './application/register-initial-stock/register-initial-stock';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly ids = inject(IdGeneratorToken);
  private readonly bus = inject(EventBusToken);
  private readonly catalog = inject(CatalogService);
  private readonly settings = inject(SettingsService);

  // Repositories and domain service exposed for cross-context wiring
  readonly stockMovementRepo = new IndexedDbStockMovementRepository(this.ids);
  readonly purchaseRepo = new IndexedDbPurchaseRepository(this.ids);
  readonly stockService = new StockService(this.catalog.supplyRepo, this.stockMovementRepo);

  // Event handler (registered in provideCore)
  readonly registerInitialStock = new RegisterInitialStock(this.stockMovementRepo);

  readonly registerPurchase = new RegisterPurchase(
    this.purchaseRepo, this.catalog.supplyRepo, this.catalog.supplierRepo, this.stockService, this.bus,
  );
  readonly adjustInventory = new AdjustInventory(
    this.catalog.supplyRepo, this.settings.settingsRepo, this.stockService, this.bus,
  );
  readonly previewAdjustment = new PreviewAdjustment(this.catalog.supplyRepo, this.settings.settingsRepo);
  readonly suppliesBelowMinimum = new SuppliesBelowMinimum(this.catalog.supplyRepo, this.catalog.supplierRepo);
  readonly listPurchases = new ListPurchases(this.purchaseRepo);
  readonly listStockMovements = new ListStockMovements(this.stockMovementRepo);
}
