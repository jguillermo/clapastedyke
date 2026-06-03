import { IndexedDbStore } from '../../shared/infrastructure/indexeddb/store';
import { AvailableSizes } from '../../catalog/domain/packaging-rule/packaging-rule-repository';
import { BusinessSettings, SettingsPrimitives } from '../domain/business-settings';
import { SettingsRepository } from '../domain/settings-repository';

const ID = 'SETTINGS';

/** Persists the settings in the browser DB. */
export class IndexedDbSettingsRepository implements SettingsRepository {
  private readonly store = new IndexedDbStore<SettingsPrimitives>('settings');

  async get(): Promise<BusinessSettings> {
    const doc = await this.store.get(ID);
    if (doc) return BusinessSettings.fromPrimitives(doc);
    // First time: seed the factory defaults (like the GAS installer).
    const defaults = BusinessSettings.default();
    await this.store.put(defaults.toPrimitives());
    return defaults;
  }

  async save(settings: BusinessSettings): Promise<void> {
    await this.store.put(settings.toPrimitives());
  }
}

/**
 * Adapter for the CATALOG's AvailableSizes port: packaging rules validate their
 * sizes against the real settings.
 */
export class SizesFromSettings implements AvailableSizes {
  constructor(private readonly settings: SettingsRepository) {}

  async names(): Promise<string[]> {
    return (await this.settings.get()).sizes.map(s => s.name);
  }
}
