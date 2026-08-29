import { bootstrapApplication } from '@angular/platform-browser';
import { readConfigDocument } from '@core/_common/infrastructure/config/public-file-app-config';
import { logBootstrapFailure } from '@core/_common/logger/console-logger';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/**
 * Arranca la app **después** de leer `public/config.json`.
 *
 * Ese orden es el que hace que la configuración sea síncrona para todo el mundo: un app-initializer
 * habría corrido en paralelo con los demás, así que el bus, el seed y el mundo 3D podían registrar
 * antes de saber si `debug` estaba encendido — y esas trazas se perderían justo cuando más se buscan,
 * en el arranque.
 *
 * `readConfigDocument()` no lanza: si el fichero falta o es ilegible devuelve `null` y la app arranca
 * en local-only, dejando un `warn`.
 *
 * No se inyecta el `Logger` aquí: si el arranque falla, el inyector no llegó a existir.
 *
 * > **La única ruta de servidor de la app es `/`.** Todo lo demás vive detrás de `#`
 * > (`withHashLocation()` en `app.config.ts`), así que aquí no hay nada que normalizar: una URL con
 * > ruta en el `pathname` no es una ruta de esta app y el servidor la trata como lo que es, un 404.
 */
readConfigDocument()
  .then((document) => bootstrapApplication(App, appConfig(document)))
  .catch(logBootstrapFailure);
