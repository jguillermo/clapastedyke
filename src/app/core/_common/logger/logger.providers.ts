import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ConsoleLogger } from './console-logger';
import { LOG_DEBUG, Logger } from './logger';

/**
 * Enlaza el registro. Va **primero** en `app.config.ts`: cualquier otra cosa puede querer registrar
 * durante el arranque.
 *
 * `debug` es lo único que se configura, y llega **como argumento**: lo saca `main.ts` de
 * `public/config.json` y lo pasa aquí. El adaptador no conoce el fichero ni la forma de la
 * configuración, solo recibe un booleano.
 *
 * Cambiar a dónde van los logs —un panel dentro del juego, un fichero, un servicio remoto— es
 * escribir otro adaptador y tocar esta línea; ningún sitio del código llama a `console` directamente.
 */
export function provideLogger(debug: boolean): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: LOG_DEBUG, useValue: debug },
    { provide: Logger, useClass: ConsoleLogger },
  ]);
}
