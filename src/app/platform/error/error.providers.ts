import { EnvironmentProviders, ErrorHandler, makeEnvironmentProviders } from '@angular/core';
import { GlobalErrorHandler } from './error-handler';

/**
 * Sustituye el `ErrorHandler` por defecto de Angular por el que registra a través del puerto
 * `Logger`. Va **el primero** en `providePlatform()`: cuanto antes esté puesto, menos ventana hay
 * para que un error temprano se escape por el handler por defecto.
 */
export function provideErrorHandling(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: ErrorHandler, useClass: GlobalErrorHandler }]);
}
