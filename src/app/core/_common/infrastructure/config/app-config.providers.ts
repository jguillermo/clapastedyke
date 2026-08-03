import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { Logger } from '../../logger/logger';
import { AppConfig, ConfigDocument } from './app-config';
import { CONFIG_DOCUMENT, PublicFileAppConfig } from './public-file-app-config';

/**
 * Enlaza el puerto de configuración con el documento **ya leído** en `main.ts`. Se agrega en
 * `app.config.ts` vía `provideAppConfig(document)`, ANTES de los contextos que la consumen.
 *
 * Ya no hay app-initializer que cargue nada: cuando esto corre, la configuración está resuelta. El
 * único initializer que queda es el que **deja constancia** de con qué arrancó la app, y existe
 * porque un `config.json` ilegible es una degradación silenciosa —el usuario se queda sin
 * sincronización y no se entera—, así que es un `warn`.
 */
export function provideAppConfig(document: ConfigDocument | null): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CONFIG_DOCUMENT, useValue: document },
    { provide: AppConfig, useClass: PublicFileAppConfig },
    provideAppInitializer(() => {
      const log = inject(Logger).scoped('config/public-file');
      if (!document) {
        log.warn('config.json no se pudo leer: la integración queda apagada', undefined, {
          url: 'config.json',
        });
        return;
      }
      // Booleanos, nunca los valores: la URL y el identificador de cliente no van a un registro.
      const { integration, debug } = inject(AppConfig);
      log.debug('configuración cargada', {
        debug,
        appsScript: integration.appsScriptUrl !== null,
        oauth: integration.googleClientId !== null,
      });
    }),
  ]);
}
