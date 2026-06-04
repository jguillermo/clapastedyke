import { UseCase } from '../../../_common/application/use-case';
import { SettingsPrimitives } from '../../domain/business-settings';
import { SettingsRepository } from '../../domain/settings-repository';

/** Loads the settings (seeding factory defaults the first time). */
export class GetSettings implements UseCase<void, SettingsPrimitives> {
  constructor(private readonly settings: SettingsRepository) {}

  async execute(): Promise<SettingsPrimitives> {
    return (await this.settings.get()).toPrimitives();
  }
}
