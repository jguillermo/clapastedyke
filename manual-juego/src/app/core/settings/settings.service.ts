import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { GetSettings } from './application/get-settings/get-settings';
import { UpdateSettings } from './application/update-settings/update-settings';
import { IndexedDbSettingsRepository } from './infrastructure/indexeddb-settings-repository';
import { EventBusToken } from '../_common/core.tokens';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly bus = inject(EventBusToken);
  private readonly transloco = inject(TranslocoService);

  readonly settingsRepo = new IndexedDbSettingsRepository();

  readonly getSettings = new GetSettings(this.settingsRepo);
  readonly updateSettings = new UpdateSettings(this.settingsRepo, this.bus);

  async syncLanguage(): Promise<void> {
    try {
      const settings = await this.settingsRepo.get();
      this.transloco.setActiveLang(settings.general.language);
    } catch {
      // IndexedDB unavailable (SSR/tests): keep the default language.
    }
  }
}
