import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { EventBusToken } from './_common/core.tokens';
import { RegisterInitialStock } from './inventory/application/register-initial-stock/register-initial-stock';
import { SyncLanguage } from './settings/application/sync-language/sync-language';
import { provideSettings } from './settings/settings.providers';
import { provideCatalog } from './catalog/catalog.providers';
import { provideInventory } from './inventory/inventory.providers';
import { provideSales } from './sales/sales.providers';
import { provideProgression } from './progression/progression.providers';
import { provideKitchen } from './kitchen/kitchen.providers';
import { provideReputation } from './reputation/reputation.providers';
import { RecordProgress } from './progression/application/record-progress/record-progress';
import { GoalType } from './progression/domain/goal-type';
import { SUPPLY_REPOSITORY } from './catalog/domain/supply/supply-repository';
import { StockStatus } from './catalog/domain/supply/supply';

/**
 * Registers the core domain at app startup:
 *  - Aggregates all context providers (settings, catalog, inventory, sales, progression)
 *  - Event subscribers (incl. progression: domain facts → RecordProgress)
 *  - UI language sync from persisted settings
 */
export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideSettings(),
    provideCatalog(),
    provideInventory(),
    provideSales(),
    provideProgression(),
    provideKitchen(),
    provideReputation(),
    provideAppInitializer(() => {
      const bus = inject(EventBusToken);
      const registerInitialStock = inject(RegisterInitialStock);
      const syncLanguage = inject(SyncLanguage);
      const record = inject(RecordProgress);
      const supplies = inject(SUPPLY_REPOSITORY);

      bus.subscribe('SupplyCreated', e => registerInitialStock.handle(e));
      void syncLanguage.execute();
      bus.subscribe('SettingsUpdated', () => syncLanguage.execute());

      // ---- Progresión: traduce hechos del negocio en avance de metas. ----
      // Proyección de almacenes (SNAPSHOT): cuántos están suficientes / con stock.
      const projectWarehouses = async (): Promise<void> => {
        const all = await supplies.all();
        const stocked = all.filter(s => s.stockStatus === StockStatus.OK).length;
        const inStock = all.filter(s => s.stock > 0).length;
        await record.execute({ type: GoalType.WAREHOUSES_STOCKED, value: stocked });
        await record.execute({ type: GoalType.SUPPLIES_IN_STOCK, value: inStock });
      };

      bus.subscribe('PurchaseRegistered', async () => {
        await record.execute({ type: GoalType.PURCHASES_REGISTERED });
        await projectWarehouses();
      });
      bus.subscribe('SupplyCreated', () => projectWarehouses());
      bus.subscribe('RecipeCooked', async () => {
        await record.execute({ type: GoalType.PRODUCTIONS_COOKED });
        await projectWarehouses();
      });
      bus.subscribe('CustomerCreated', () => record.execute({ type: GoalType.CUSTOMERS_REGISTERED }));
      bus.subscribe('OrderCreated', () => record.execute({ type: GoalType.ORDERS_CREATED }));
      bus.subscribe('OrderDelivered', () => record.execute({ type: GoalType.SALES_COMPLETED }));

      // Reputation (Fase 2).
      bus.subscribe('ProductionPublished', () => record.execute({ type: GoalType.POSTS_PUBLISHED }));
      bus.subscribe('PopularityUpdated', e =>
        record.execute({ type: GoalType.POPULARITY, value: Number(e.data['points'] ?? 0) }),
      );
      bus.subscribe('InformalOrderReceived', () => record.execute({ type: GoalType.INFORMAL_ORDERS }));
    }),
  ]);
}
