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
      // Un booleano, nunca el valor: el identificador de cliente no va a un registro.
      const { integration, debug } = inject(AppConfig);

      // El `config.json` versionado lleva un MARCADOR donde va el Client ID, y lo sustituye el
      // pipeline al publicar. Que llegue algo que no es un Client ID significa que esa sustitución
      // no ocurrió: la integración queda apagada (mejor que un botón que falla al pulsarlo) y aquí
      // se dice por qué, porque si no es una degradación que nadie ve.
      const declarado = (document.googleClientId ?? '').trim();
      if (declarado.length > 0 && integration.googleClientId === null) {
        log.warn(
          'el googleClientId de config.json no es un Client ID: la integración queda apagada. ' +
            'Si esto es un despliegue, el pipeline no sustituyó el marcador',
        );
      }

      log.debug('configuración cargada', {
        debug,
        oauth: integration.googleClientId !== null,
      });
    }),
  ]);
}
