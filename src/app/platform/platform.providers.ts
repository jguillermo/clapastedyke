import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideTranslation } from './i18n/translation.providers';

export function providePlatform(): EnvironmentProviders {
  return makeEnvironmentProviders([provideTranslation()]);
}
