import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { AppConfig } from './app-config';
import { PublicFileAppConfig } from './public-file-app-config';

/**
 * Enlaza el puerto de configuración con la implementación que lee `public/config.json` y la carga
 * antes de que la app renderice. Se agrega en `app.config.ts` vía `provideAppConfig()`, ANTES de
 * los contextos que la consumen.
 */
export function provideAppConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AppConfig, useClass: PublicFileAppConfig },
    provideAppInitializer(() => inject(AppConfig).load()),
  ]);
}
