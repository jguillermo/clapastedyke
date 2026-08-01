import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ConsoleLogger } from './console-logger';
import { Logger } from './logger';

/**
 * Enlaza el registro. Va **primero** en `app.config.ts`: cualquier otra cosa puede querer registrar
 * durante el arranque.
 *
 * Cambiar a dónde van los logs —un panel dentro del juego, un fichero, un servicio remoto— es
 * escribir otro adaptador y tocar esta línea; ningún sitio del código llama a `console` directamente.
 */
export function provideLogger(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: Logger, useClass: ConsoleLogger }]);
}
