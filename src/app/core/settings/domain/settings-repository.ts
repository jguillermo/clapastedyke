import { InjectionToken } from '@angular/core';
import { BusinessSettings } from './business-settings';

/**
 * Persistence port for the settings (singleton aggregate).
 * `get()` seeds and returns the factory defaults the first time if they do not
 * exist yet (equivalent to the GAS installer seed).
 */
export interface SettingsRepository {
  get(): Promise<BusinessSettings>;
  save(settings: BusinessSettings): Promise<void>;
}

export const SETTINGS_REPOSITORY = new InjectionToken<SettingsRepository>('SettingsRepository');
