import { AvailableSizes } from '../domain/packaging-rule/packaging-rule-repository';
import { SettingsRepository } from '../../settings/domain/settings-repository';

export class SizesFromSettings implements AvailableSizes {
  constructor(private readonly settings: SettingsRepository) {}

  async names(): Promise<string[]> {
    return (await this.settings.get()).sizes.map(s => s.name);
  }
}
