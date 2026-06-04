import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { SETTINGS_REPOSITORY } from '../../domain/settings-repository';

@Injectable({ providedIn: 'root' })
export class SyncLanguage {
  private readonly settings = inject(SETTINGS_REPOSITORY);
  private readonly transloco = inject(TranslocoService);

  async execute(): Promise<void> {
    try {
      const s = await this.settings.get();
      this.transloco.setActiveLang(s.general.language);
    } catch {
      // IndexedDB unavailable (SSR/tests): keep the default language.
    }
  }
}
