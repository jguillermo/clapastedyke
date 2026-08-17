/**
 * La cookie de sesión, compartida por todas las funciones de `api/`.
 *
 * ## Por qué se llama `__session` y no otra cosa
 *
 * **Firebase Hosting borra todas las cookies entrantes menos `__session`** antes de pasar la
 * petición a la función. No es una preferencia de nombre: cualquier otro nombre simplemente no
 * llegaría, y la sesión no se reanudaría nunca detrás de Hosting.
 *
 * ## Por qué `HttpOnly`
 *
 * Es lo único que impide que un XSS lea el identificador de sesión. El token de acceso sigue
 * viviendo en memoria del navegador y durando una hora; lo que la cookie protege es la capacidad de
 * **pedir uno nuevo**, que es lo que dura meses.
 */
export const SESSION_COOKIE = '__session';

/** Seis meses. Lo que dura la comodidad de no volver a conectar. */
export const SESSION_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

/** Lee una cookie de la cabecera `Cookie` cruda. `null` si no está o viene vacía. */
export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) {
    return null;
  }
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) {
      continue;
    }
    if (part.slice(0, separator).trim() !== name) {
      continue;
    }
    const value = decodeURIComponent(part.slice(separator + 1).trim());
    return value.length > 0 ? value : null;
  }
  return null;
}

/**
 * `SameSite=Lax` y no `Strict`: la app es una SPA que se abre desde enlaces y desde la ventana de
 * Google, y con `Strict` la primera navegación entrante llegaría sin cookie y parecería sesión
 * caducada. `Lax` ya impide el envío en peticiones cruzadas, que es de lo que protege.
 *
 * @param secure `false` solo en desarrollo sobre `http://localhost`; Safari no guarda cookies
 *   `Secure` servidas por http, y sin esto no se podría probar el ciclo entero en local.
 */
export function sessionCookie(
  sid: string,
  secure: boolean,
  maxAgeSeconds = SESSION_MAX_AGE_SECONDS,
): string {
  return attributes(`${SESSION_COOKIE}=${encodeURIComponent(sid)}`, secure, maxAgeSeconds);
}

/** La misma cookie con `Max-Age=0`: es la única forma de borrarla desde el servidor. */
export function clearedSessionCookie(secure: boolean): string {
  return attributes(`${SESSION_COOKIE}=`, secure, 0);
}

function attributes(pair: string, secure: boolean, maxAgeSeconds: number): string {
  const parts = [pair, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSeconds}`];
  if (secure) {
    parts.push('Secure');
  }
  return parts.join('; ');
}
