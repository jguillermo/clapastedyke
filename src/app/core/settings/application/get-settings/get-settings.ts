import { Injectable, inject } from '@angular/core';
import { UseCase } from '../../../_common/application/use-case';
import { SettingsPrimitives } from '../../domain/business-settings';
import { SETTINGS_REPOSITORY } from '../../domain/settings-repository';

/** Loads the settings (seeding factory defaults the first time). */
@Injectable({ providedIn: 'root' })
export class GetSettings implements UseCase<void, SettingsPrimitives> {
  private readonly settings = inject(SETTINGS_REPOSITORY);

  async execute(): Promise<SettingsPrimitives> {
    return (await this.settings.get()).toPrimitives();
  }
}
