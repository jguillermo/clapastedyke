/**
 * Transporte hacia las APIs REST de Google (Sheets y Drive): el único sitio del contexto que hace
 * peticiones de red.
 *
 * **Se puede llamar desde el navegador, y con cabecera `Authorization`.** Las APIs REST de Google
 * responden al preflight CORS, así que aquí no hacen falta los rodeos que sí exigía un Web App de
 * Apps Script (mandar el token en el cuerpo, `text/plain`, nada de cabeceras propias).
 *
 * **Traduce y relanza; no registra.** Conserva el fallo original en `{ cause }` del `SyncError` que
 * lanza, y de contarlo responde quien decide el resultado visible. Ver logging-conventions.md →
 * «un dueño por fallo».
 */

import { SyncError, SyncErrorCode } from '../domain/services/sync.gateway.types';

export interface GoogleFetchOptions {
  /**
   * Códigos que NO son un fallo para quien llama: se devuelve `null` en su lugar. Sirve para
   * preguntas cuya respuesta legítima es «no está» (un 404 de Drive sobre una hoja borrada).
   */
  tolerate?: readonly number[];
}

export async function googleFetch<Result>(
  credential: string,
  method: 'GET' | 'POST' | 'PUT',
  url: string,
  body?: unknown,
  options: GoogleFetchOptions = {},
): Promise<Result> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${credential}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json; charset=utf-8' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new SyncError(
      'NETWORK',
      'No se ha podido contactar con Google. Comprueba tu conexión y reinténtalo.',
      { cause: error },
    );
  }

  if (response.ok) {
    return (await response.json().catch(() => ({}))) as Result;
  }
  if (options.tolerate?.includes(response.status)) {
    return null as Result;
  }

  const parsed: unknown = await response.json().catch(() => ({}));
  throw new SyncError(codeFor(response.status), describe(response.status, messageOf(parsed)));
}

function messageOf(parsed: unknown): string {
  return (parsed as { error?: { message?: string } } | null)?.error?.message ?? '';
}

function codeFor(status: number): SyncErrorCode {
  switch (status) {
    case 401:
      return 'UNAUTHENTICATED';
    case 403:
      return 'REJECTED';
    case 404:
      return 'TARGET_GONE';
    case 429:
      return 'QUOTA';
    default:
      return status >= 500 ? 'NETWORK' : 'INTERNAL';
  }
}

/** Mensajes escritos para leerse en pantalla; el detalle técnico va en el registro, por la causa. */
function describe(status: number, message: string): string {
  switch (status) {
    case 401:
      return 'Tu sesión con Google ha caducado. Vuelve a conectar la cuenta.';
    case 403:
      return message.includes('quota')
        ? 'Google está limitando las peticiones. Espera un momento y reinténtalo.'
        : 'Google no ha autorizado la operación sobre tu hoja. Vuelve a conectar y acepta el permiso.';
    case 404:
      return 'Tu hoja ya no está donde estaba: la han borrado o movido a la papelera.';
    case 429:
      return 'Google está limitando las peticiones. Espera un momento y reinténtalo.';
    default:
      return message
        ? `Google ha rechazado la operación (${status}): ${message}`
        : `Google ha rechazado la operación (${status}).`;
  }
}
