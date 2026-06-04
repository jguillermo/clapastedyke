import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { BusinessSize, GeneralSettings } from '../../domain/business-settings';
import { SETTINGS_REPOSITORY } from '../../domain/settings-repository';

export interface UpdateSettingsRequest {
  general?: Partial<GeneralSettings>;
  sizes?: BusinessSize[];
}

/**
 * Edits the settings (Flow 13): general settings and/or sizes.
 * Only affects NEW quotes — the saved ones are frozen.
 */
@Injectable({ providedIn: 'root' })
export class UpdateSettings implements UseCase<UpdateSettingsRequest, void> {
  private readonly settings = inject(SETTINGS_REPOSITORY);
  private readonly bus = inject(EventBusToken);

  async execute(request: UpdateSettingsRequest): Promise<void> {
    const settings = await this.settings.get();
    if (request.general) settings.updateGeneral(request.general);
    if (request.sizes) settings.replaceSizes(request.sizes);
    await this.settings.save(settings);
    await this.bus.publish(settings.pullEvents());
  }
}
