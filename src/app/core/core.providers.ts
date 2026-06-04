import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { EventBusToken } from './_common/core.tokens';
import { InventoryService } from './inventory/inventory.service';
import { SettingsService } from './settings/settings.service';

/**
 * Registers the core domain at app startup:
 *  - Event subscribers (SupplyCreated → RegisterInitialStock)
 *  - UI language sync from persisted settings
 */
export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const bus = inject(EventBusToken);
      const inventory = inject(InventoryService);
      const settings = inject(SettingsService);

      bus.subscribe('SupplyCreated', e => inventory.registerInitialStock.handle(e));

      void settings.syncLanguage();
      bus.subscribe('SettingsUpdated', () => settings.syncLanguage());
    }),
  ]);
}
