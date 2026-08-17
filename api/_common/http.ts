/**
 * Utilidades HTTP compartidas por **todas** las funciones de `api/`.
 *
 * No hay Express aquí a propósito: cada función despacha tres o cuatro rutas y un router de
 * verdad sería más código que las rutas. Lo que sí hace falta está aquí, para que dos funciones no
 * inventen dos formas distintas de responder un error.
 *
 * ## CRITICAL: `_common/` no importa paquetes de terceros
 *
 * Esta carpeta vive **fuera** del directorio de cualquier función, así que no tiene un
 * `node_modules` encima: TypeScript no encuentra desde aquí nada que esté en
 * `api/<función>/node_modules` (error `TS2307`). En ejecución sí funcionaría —la copia compilada
 * acaba dentro de la función— y esa asimetría es justo lo que la hace traicionera.
 *
 * Así que la regla es simple y también es la correcta: **aquí solo entran módulos nativos de Node y
 * tipos propios.** Cualquier cosa con dependencias va en la carpeta de su función. De paso, evita
 * que un ayudante compartido obligue a todas las funciones a declarar un paquete que quizá solo usa
 * una.
 *
 * Por eso el tipo de la respuesta se declara aquí en vez de importarse de `express`: solo se usan
 * cuatro métodos, y la `Response` de verdad los satisface estructuralmente.
 */

/** Lo justo que estas utilidades necesitan de una respuesta HTTP. */
export interface HttpResponse {
  setHeader(name: string, value: string): unknown;
  status(code: number): HttpResponse;
  json(body: unknown): unknown;
  send(body: string): unknown;
}

/** Lo justo que un manejador necesita de una petición. */
export interface HttpRequest {
  method: string;
  path: string;
  body: unknown;
  headers: { cookie?: string | undefined };
}

/** Lo que viaja en el cuerpo de un error. El cliente distingue por `error`, no por el texto. */
export interface ApiError {
  error: string;
  message: string;
}

/**
 * La ruta dentro de la función, **venga como venga**.
 *
 * Detrás del rewrite de Firebase Hosting la función recibe la ruta original completa
 * (`/api/auth/exchange`); a través del proxy de `ng serve`, que ya apunta a la función, recibe solo
 * `/exchange`. Las dos formas tienen que acabar en el mismo sitio, y normalizarlas en un único
 * punto es lo que evita tener que acordarse de ello en cada ruta.
 */
export function normalizePath(rawPath: string, functionName: string): string {
  const prefix = `/api/${functionName}`;
  let path = (rawPath.split('?')[0] ?? '').trim();

  if (path === prefix) {
    path = '/';
  } else if (path.startsWith(`${prefix}/`)) {
    path = path.slice(prefix.length);
  }

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  // `/exchange/` y `/exchange` son la misma ruta; `/` se queda como está.
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

/**
 * **Ninguna respuesta de la API se cachea, nunca.**
 *
 * No es paranoia: Firebase Hosting tiene una CDN delante de las funciones, y una respuesta de
 * `/auth/token` cacheada serviría el token de una persona a la siguiente. `private` lo prohíbe a
 * los intermediarios y `no-store` también al navegador.
 */
export function noStore(res: HttpResponse): void {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  // La respuesta depende de la cookie de sesión; sin esto un intermediario podría creer que no.
  res.setHeader('Vary', 'Cookie');
}

export function sendJson(res: HttpResponse, status: number, payload: unknown): void {
  noStore(res);
  res.status(status).json(payload);
}

export function sendNoContent(res: HttpResponse): void {
  noStore(res);
  res.status(204).send('');
}

export function sendError(res: HttpResponse, status: number, error: string, message: string): void {
  sendJson(res, status, { error, message } satisfies ApiError);
}

/** El cuerpo como objeto, o `null` si no lo es. Firebase ya lo parsea cuando es JSON. */
export function jsonBody(body: unknown): Record<string, unknown> | null {
  if (typeof body === 'string') {
    try {
      const parsed: unknown = JSON.parse(body);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return isRecord(body) ? body : null;
}

/** Un campo de texto no vacío del cuerpo, o `null`. */
export function requiredString(body: Record<string, unknown> | null, field: string): string | null {
  const value = body?.[field];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
