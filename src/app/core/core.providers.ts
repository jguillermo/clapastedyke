import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { EventBusToken } from './_common/core.tokens';
import { RegisterInitialStock } from './inventory/application/register-initial-stock/register-initial-stock';
import { SyncLanguage } from './settings/application/sync-language/sync-language';
import { provideSettings } from './settings/settings.providers';
import { provideCatalog } from './catalog/catalog.providers';
import { provideInventory } from './inventory/inventory.providers';
import { provideSales } from './sales/sales.providers';

/**
 * Registers the core domain at app startup:
 *  - Aggregates all context providers (settings, catalog, inventory, sales)
 *  - Event subscribers (SupplyCreated → RegisterInitialStock)
 *  - UI language sync from persisted settings
 */
export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideSettings(),
    provideCatalog(),
    provideInventory(),
    provideSales(),
    provideAppInitializer(() => {
      const bus = inject(EventBusToken);
      const registerInitialStock = inject(RegisterInitialStock);
      const syncLanguage = inject(SyncLanguage);

      bus.subscribe('SupplyCreated', e => registerInitialStock.handle(e));
      void syncLanguage.execute();
      bus.subscribe('SettingsUpdated', () => syncLanguage.execute());
    }),
  ]);
}
