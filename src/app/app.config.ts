import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation, withNavigationErrorHandler } from '@angular/router';

import { routes } from './app.routes';
import { ConfigDocument } from '@core/_common/infrastructure/config/app-config';
import { provideAppConfig } from '@core/_common/infrastructure/config/app-config.providers';
import { provideLogger } from '@core/_common/logger/logger.providers';
import { provideEventBus, provideEventTracing } from '@core/_common/eventbus/event-bus.providers';
import { provideLocalData } from '@core/_common/local-data/local-data.providers';
import { provideRecipeBook } from '@core/recipe-book/recipe-book.providers';
import { provideAuth } from '@core/auth/auth.providers';
import { provideExternalSync } from '@core/external-sync/external-sync.providers';
import { providePlatform } from '@platform/platform.providers';
import { reloadOnStaleBuild } from '@platform/stale-build/stale-build';

/**
 * La composición de la app, **a partir del documento de configuración ya leído**.
 *
 * Es una función y no una constante porque `public/config.json` se lee en `main.ts` antes de arrancar
 * (ver {@link readConfigDocument}): así todo lo que se inyecta aquí encuentra la configuración
 * resuelta y **síncrona**, y el registro no se pierde las trazas del propio arranque.
 *
 * `document` es `null` cuando el fichero no se pudo leer. No se rompe nada: la integración queda
 * apagada, `debug` en `false`, y el initializer de `provideAppConfig` deja el `warn`.
 */
export function appConfig(document: ConfigDocument | null): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      /*
       * `withHashLocation()` — las rutas de la app van **detrás de `#`**: `/#/home`, `/#/cuenta`.
       *
       * Lo que compra: **el servidor deja de tener voz en la navegación**. Todo lo que va detrás de
       * `#` no se envía nunca en la petición, así que el navegador solo pide `/` y de ahí en adelante
       * enruta Angular. Ninguna ruta de la app puede chocar con `/api/**` ni con un fichero estático.
       *
       * Por eso **`firebase/firebase.json` no tiene fallback de SPA**, y no debe volver a tenerlo: `/` es
       * la única ruta de servidor que la app necesita. El que había (`**\/!(*.*)`, «cualquier ruta
       * sin punto») además tenía su propia trampa — una ruta futura con un punto dentro,
       * `/receta/pan-de-3.5-kg`, no habría casado, y al recargar daría 404 en producción mientras en
       * `ng serve` funcionaba.
       *
       * El precio, y se acepta: la URL lleva `#`, y el fragmento no llega ni a los logs del servidor
       * ni a un rastreador. Para una app privada sin SEO no cuesta nada. (Los «Orígenes de JavaScript
       * autorizados» de Google son orígenes, sin ruta, así que el hash no los toca.)
       *
       * `withNavigationErrorHandler`: las rutas se cargan con `import()`, y si el despliegue cambió
       * mientras la pestaña estaba abierta, el chunk que pide ya no existe. `reloadOnStaleBuild` lo
       * reconoce y recarga a la ruta pedida en vez de dejar la pantalla congelada.
       * Ver `platform/stale-build/`.
       */
      provideRouter(routes, withHashLocation(), withNavigationErrorHandler(reloadOnStaleBuild)),
      // El registro va el primero de todos: cualquier otra cosa puede querer registrar al arrancar.
      // `debug` sale del fichero de configuración; el resto de niveles se ven siempre.
      provideLogger(document?.debug === true),
      // La configuración va primero: la autenticación y la sincronización leen de ella.
      provideAppConfig(document),
      provideEventBus(),
      // Cómo se borra TODO lo que este navegador guarda (cerrar sesión lo usa). Va después del bus:
      // vacía también su cola de eventos, que vive en otra base de datos.
      provideLocalData(),
      // Diagnóstico: deja en consola todos los eventos que se reparten. Quitar esta línea lo apaga.
      provideEventTracing(),
      provideRecipeBook(),
      provideAuth(),
      provideExternalSync(),
      providePlatform(),
    ],
  };
}
