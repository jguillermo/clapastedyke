import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { SETTINGS_REPOSITORY } from './domain/settings-repository';
import { IndexedDbSettingsRepository } from './infrastructure/indexeddb-settings-repository';

export function provideSettings(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SETTINGS_REPOSITORY, useClass: IndexedDbSettingsRepository },
  ]);
}
