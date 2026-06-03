import { BusinessSettings } from '../domain/business-settings';
import { SettingsRepository } from '../domain/settings-repository';

/** In-memory double for tests. */
export class MemorySettingsRepository implements SettingsRepository {
  private current: BusinessSettings | null = null;

  async get(): Promise<BusinessSettings> {
    this.current ??= BusinessSettings.default();
    return BusinessSettings.fromPrimitives(this.current.toPrimitives());
  }

  async save(settings: BusinessSettings): Promise<void> {
    this.current = BusinessSettings.fromPrimitives(settings.toPrimitives());
  }
}
