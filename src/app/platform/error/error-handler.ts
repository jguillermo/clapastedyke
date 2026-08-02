import { ErrorHandler, inject, Injectable } from '@angular/core';
import { Logger } from '@core/_common/logger/logger';

/**
 * El último recinto: **todo lo que nadie capturó acaba aquí**.
 *
 * `provideBrowserGlobalErrorListeners()` (en `app.config.ts`) engancha `window.error` y
 * `unhandledrejection` y los enruta al `ErrorHandler` de la aplicación — o sea, a esto. Por eso
 * **no hacen falta listeners propios**: añadirlos duplicaría cada reporte.
 *
 * Sin esta clase, Angular usa su `ErrorHandler` por defecto, que escribe con un `console.error`
 * crudo: se salta el puerto, no lleva scope y ningún adaptador futuro podría redirigirlo. Con ella,
 * un error no capturado sale como cualquier otro registro del proyecto, con su pila y su cadena
 * `cause`, **también en producción**.
 *
 * Lo que **no** llega aquí es el fallo de arranque: ocurre antes de que exista el inyector, así que
 * lo recoge `logBootstrapFailure` en `main.ts`.
 *
 * Nota: Angular no distingue una excepción no capturada de una promesa rechazada — llegan por el
 * mismo método, sin marcador. Se registran igual, bajo un único scope `[uncaught]`.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly log = inject(Logger).scoped('uncaught');

  handleError(error: unknown): void {
    this.log.error(headline(error), error);
  }
}

/** Un titular corto y grepeable. El detalle y la pila los aporta el propio error. */
function headline(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return 'Se rechazó una promesa con un valor que no es un Error';
}
