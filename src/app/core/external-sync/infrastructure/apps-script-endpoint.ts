/**
 * Transporte hacia el Web App de Apps Script: el único sitio de la app que sabe hablar con él.
 */

import { SyncError, SyncErrorCode } from '../domain/services/sync.gateway.types';

interface AppsScriptFailure {
  ok: false;
  error?: { code?: string; message?: string };
}

/**
 * Traducción de los códigos del script a los que declara el puerto. Es la parte anticorrupción del
 * transporte: el dominio no tiene por qué conocer el vocabulario de Apps Script.
 */
const ERROR_CODES: Readonly<Record<string, SyncErrorCode>> = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  SCOPE_MISSING: 'UNAUTHENTICATED',
  CLIENT_MISMATCH: 'NOT_CONFIGURED',
  BAD_REQUEST: 'REJECTED',
  QUOTA: 'QUOTA',
  INTERNAL: 'INTERNAL',
};

/**
 * Manda una operación al script y devuelve su respuesta.
 *
 * **Por qué `text/plain` y el token en el cuerpo, y no una cabecera `Authorization`:** un Web App de
 * Apps Script no responde al preflight CORS. Cualquier cabecera personalizada — o un
 * `Content-Type: application/json` — convierte la petición en «no simple», el navegador manda un
 * OPTIONS previo, nadie lo contesta y la llamada falla antes de salir. Con `text/plain` y sin
 * cabeceras propias es una petición simple: no hay preflight. El token viaja, por eso, en el JSON.
 *
 * No tocar sin leer `manual/appscript.md` → «Solución de problemas».
 */
export async function postToAppsScript<Result>(endpoint: string, body: unknown): Promise<Result> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      // Tipo de contenido «seguro» de CORS: evita el preflight que Apps Script no atiende.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow', // el script responde con un 302 a script.googleusercontent.com
    });
  } catch (error) {
    throw new SyncError(
      'NETWORK',
      'No se ha podido contactar con el Apps Script. Revisa tu conexión y la URL configurada.',
      { cause: error },
    );
  }

  if (!response.ok) {
    throw new SyncError(
      'NETWORK',
      `El Apps Script ha respondido ${response.status}. Comprueba que la URL termina en /exec y que el despliegue es accesible para «cualquiera».`,
    );
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch (error) {
    throw new SyncError(
      'INTERNAL',
      'La respuesta del Apps Script no es JSON. Suele significar que la URL apunta a /dev o a un despliegue que pide iniciar sesión.',
      { cause: error },
    );
  }

  if (!isOk(parsed)) {
    const failure = parsed as AppsScriptFailure;
    throw new SyncError(
      normalizeCode(failure.error?.code),
      failure.error?.message ?? 'El Apps Script ha rechazado la operación.',
    );
  }

  return parsed as Result;
}

function isOk(parsed: unknown): boolean {
  return typeof parsed === 'object' && parsed !== null && (parsed as { ok?: unknown }).ok === true;
}

function normalizeCode(code: string | undefined): SyncErrorCode {
  return (code !== undefined ? ERROR_CODES[code] : undefined) ?? 'INTERNAL';
}
