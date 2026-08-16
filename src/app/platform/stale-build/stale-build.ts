import { inject } from '@angular/core';
import { NavigationError } from '@angular/router';
import { Logger } from '@core/_common/logger/logger';

/**
 * Recuperación del **despliegue caducado**: la pestaña abierta sigue ejecutando un build que ya no
 * está en el servidor.
 *
 * Las rutas se cargan con `import()` (`app.routes.ts`), así que el `main-*.js` que corre en el
 * navegador pide su `chunk-*.js` **por el nombre con hash del build que lo generó**. Al publicar,
 * Firebase Hosting **borra los ficheros que no están en la release nueva**: quien tuviera la app
 * abierta —o vuelva a ella desde el bfcache— conserva el `main` viejo en caché (`immutable`, un año)
 * y pide un chunk que ya no existe. La navegación revienta con
 * *«Failed to fetch dynamically imported module»* y la pantalla se queda como estaba: nada indica al
 * usuario que basta con recargar.
 *
 * Esto lo convierte en lo que es —el build cambió debajo— y **recarga a la ruta que se pedía**, con
 * lo que el navegador se trae el `index.html` nuevo (se sirve `no-cache`) y con él los hashes
 * vigentes. El usuario aterriza donde iba, no en el inicio.
 *
 * No es un servicio ni tiene `provide*()`: `withNavigationErrorHandler` es una **feature del
 * router**, así que se pasa a `provideRouter(...)` en `app.config.ts` y no puede agregarse en
 * `providePlatform()`. Corre **en contexto de inyección**, de ahí el `inject(Logger)`.
 *
 * Solo cubre los fallos de **navegación**, que es donde hoy vive todo `import()` dinámico del
 * proyecto. Cualquier otro error sigue su curso hasta el `GlobalErrorHandler`.
 */
export function reloadOnStaleBuild(event: NavigationError): void {
  const log = inject(Logger).scoped('stale-build');

  if (!isChunkLoadFailure(event.error)) {
    return; // No es lo nuestro: que lo registre quien corresponda.
  }

  const now = Date.now();
  const last = readLastAttempt(log);
  if (last !== null && now - last < LOOP_WINDOW_MS) {
    // Ya se recargó hace nada y ha vuelto a fallar: el chunk no falta por un despliegue, falta de
    // verdad (sin red, publicación a medias). Recargar otra vez sería un bucle.
    log.error('la ruta sigue sin cargar después de recargar', event.error, { url: event.url });
    return;
  }

  writeLastAttempt(now, log);
  log.warn('el despliegue cambió bajo los pies: recargando el build nuevo', event.error, {
    url: event.url,
  });
  window.location.assign(event.url);
}

/**
 * Ventana dentro de la cual un segundo fallo se lee como «la recarga no lo arregló» y no como un
 * despliegue nuevo. Pasada, la sesión vuelve a tener derecho a una recarga: publicar dos veces
 * mientras alguien usa la app es normal y también debe recuperarse.
 */
const LOOP_WINDOW_MS = 30_000;

/** Cuándo se recargó por última vez. En `sessionStorage`: es de **esta** pestaña, y muere con ella. */
const LAST_ATTEMPT_KEY = 'migo.stale-build.last-attempt';

/**
 * El mensaje del fallo de `import()`, que **cada navegador redacta a su manera**. No hay un tipo de
 * error ni un código que mirar, así que se compara por texto, en minúsculas y por subcadena.
 */
const CHUNK_FAILURE_MESSAGES = [
  'failed to fetch dynamically imported module', // Chrome, Edge
  'error loading dynamically imported module', // Firefox
  'importing a module script failed', // Safari
];

/** Recorre la cadena `cause` por si alguien envolvió el fallo original. */
function isChunkLoadFailure(error: unknown): boolean {
  for (let current = error, depth = 0; current instanceof Error && depth < 5; depth++) {
    const message = current.message.toLowerCase();
    if (CHUNK_FAILURE_MESSAGES.some((known) => message.includes(known))) {
      return true;
    }
    current = current.cause;
  }
  return false;
}

/** `null` si no hay marca o si el almacenamiento no está disponible (Safari privado, iframes). */
function readLastAttempt(log: Logger): number | null {
  try {
    const stored = Number(window.sessionStorage.getItem(LAST_ATTEMPT_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : null;
  } catch (error) {
    log.warn('no se pudo leer la marca de recarga: se recargará sin guarda de bucle', error);
    return null;
  }
}

function writeLastAttempt(now: number, log: Logger): void {
  try {
    window.sessionStorage.setItem(LAST_ATTEMPT_KEY, String(now));
  } catch (error) {
    log.warn('no se pudo anotar la marca de recarga: sin guarda contra bucles', error);
  }
}
