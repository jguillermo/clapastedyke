import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
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
