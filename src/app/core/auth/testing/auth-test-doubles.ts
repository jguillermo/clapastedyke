import { Provider } from '@angular/core';
import { ConsoleLogger } from '@core/_common/logger/console-logger';
import { Logger } from '@core/_common/logger/logger';

/**
 * Los dobles del contexto `auth`.
 *
 * De momento solo enchufa el **logger de verdad**, y eso ya es motivo suficiente para que exista:
 * los cinco casos de uso de `auth` inyectan `Logger`, así que un `TestBed` que los instancie sin
 * este proveedor revienta con `NullInjectorError` antes de llegar a la primera aserción.
 *
 * Es el adaptador real, no un doble: el logger solo escribe cuando lo llaman, y en los tests
 * `LOG_DEBUG` es `false` por defecto, así que la traza del flujo no ensucia la salida. Lo que sí se ve
 * —un `warn` o un `error`— es algo que conviene leer.
 *
 * Los dobles de `Authenticator`, `Session` y `AuthSettingsRepository` se añaden aquí conforme haga
 * falta, con la forma de `recipe-book-test-doubles.ts` y `external-sync-test-doubles.ts`.
 */
export function provideAuthTestDoubles(): Provider[] {
  return [{ provide: Logger, useClass: ConsoleLogger }];
}
