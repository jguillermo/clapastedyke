/**
 * El diálogo con Google: canjear un código, refrescar un token y revocar el permiso.
 *
 * Es el **único** fichero de la función que sabe cómo habla Google. Todo lo demás trabaja con
 * `GoogleTokens` y `GoogleProfile`.
 *
 * ## Lo que hace confidencial a este cliente
 *
 * El navegador no puede guardar un `client_secret`, así que un cliente público solo puede obtener
 * tokens de acceso de una hora y ningún **refresh token**. Aquí sí hay secreto, y por eso Google
 * entrega un refresh token que no caduca: es toda la diferencia entre «recargar te echa» y no.
 */
import type { OAuthClient } from './config';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';

/** Sin esto la app no puede crear ni escribir la hoja del usuario: es el permiso que se exige. */
export const DRIVE_FILE_PERMISSION = 'https://www.googleapis.com/auth/drive.file';

/** Ninguna llamada a Google puede colgar a la función indefinidamente. */
const TIMEOUT_MS = 10_000;

export interface GoogleTokens {
  accessToken: string;
  expiresIn: number;
  scope: string;
  /** Solo lo devuelve el canje inicial. Al refrescar, Google **no** lo repite. */
  refreshToken: string | null;
  idToken: string | null;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
}

/**
 * Un fallo con nombre, para poder decidir sobre él.
 *
 * `invalid_grant` es el único que importa de verdad: significa que el refresh token ya no vale
 * —porque la persona retiró el acceso desde su cuenta de Google, o porque la app sigue en modo
 * «Testing» y Google lo caducó a los 7 días—. La reacción no es reintentar, es olvidarlo.
 */
export class GoogleOAuthError extends Error {
  constructor(
    readonly code: string,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'GoogleOAuthError';
  }

  get isInvalidGrant(): boolean {
    return this.code === 'invalid_grant';
  }
}

/**
 * Canjea el código de autorización que el navegador acaba de obtener con `initCodeClient`.
 *
 * **`redirect_uri: 'postmessage'` es obligatorio** y no es un valor inventado: es lo que Google
 * exige cuando el código viene del flujo de ventana emergente de Google Identity Services, donde no
 * hay ninguna URL de redirección de verdad. Sin él, el canje falla con `redirect_uri_mismatch`.
 */
export async function exchangeCode(code: string, client: OAuthClient): Promise<GoogleTokens> {
  return post({
    code,
    client_id: client.clientId,
    client_secret: client.clientSecret,
    redirect_uri: 'postmessage',
    grant_type: 'authorization_code',
  });
}

/** Emite un token de acceso nuevo. Es lo que corre en cada recarga y cada hora. */
export async function refreshAccessToken(
  refreshToken: string,
  client: OAuthClient,
): Promise<GoogleTokens> {
  return post({
    refresh_token: refreshToken,
    client_id: client.clientId,
    client_secret: client.clientSecret,
    grant_type: 'refresh_token',
  });
}

/**
 * Retira el permiso concedido. Revocar un refresh token **revoca la concesión entera**, así que
 * también mueren los tokens de acceso vivos en otros dispositivos: es exactamente lo que significa
 * «cerrar sesión» en esta app, y coincide con lo que hacía el flujo anterior.
 *
 * No lanza: cerrar sesión en local no puede depender de que Google conteste.
 */
export async function revokeToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(REVOKE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }).toString(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** ¿La concesión incluye el permiso de Drive? El `scope` de Google es una lista separada por espacios. */
export function grants(scope: string, permission: string): boolean {
  return scope.split(' ').includes(permission);
}

/**
 * El perfil que viaja dentro del `id_token`.
 *
 * **No se verifica la firma, y es correcto.** El `id_token` no nos lo ha dado un cliente: lo acaba
 * de devolver el endpoint de Google por TLS, en respuesta a una petición nuestra autenticada con el
 * `client_secret`. La propia especificación de OpenID Connect (§3.1.3.7) dice que, cuando el token
 * llega por comunicación directa con el token endpoint, la validación del servidor TLS sustituye a
 * la comprobación de la firma. Verificarla otra vez costaría una dependencia y una descarga de
 * claves para no añadir ninguna garantía.
 */
export function readProfile(idToken: string | null): GoogleProfile | null {
  if (!idToken) {
    return null;
  }
  const payload = decodeJwtPayload(idToken);
  if (!payload) {
    return null;
  }

  const sub = typeof payload['sub'] === 'string' ? payload['sub'] : '';
  const email = typeof payload['email'] === 'string' ? payload['email'] : '';
  if (!sub || !email) {
    return null;
  }
  return {
    sub,
    email,
    name: typeof payload['name'] === 'string' ? payload['name'] : '',
    picture: typeof payload['picture'] === 'string' ? payload['picture'] : null,
  };
}

function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const segments = jwt.split('.');
  if (segments.length < 2 || !segments[1]) {
    return null;
  }
  try {
    const json = Buffer.from(segments[1], 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(json);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

interface TokenEndpointResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  refresh_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

async function post(form: Record<string, string>): Promise<GoogleTokens> {
  let response: Response;
  try {
    response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form).toString(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new GoogleOAuthError('network', 'No se ha podido contactar con Google.', {
      cause: error,
    });
  }

  let payload: TokenEndpointResponse;
  try {
    payload = (await response.json()) as TokenEndpointResponse;
  } catch (error) {
    throw new GoogleOAuthError('malformed', 'Google ha devuelto una respuesta ilegible.', {
      cause: error,
    });
  }

  if (!response.ok || payload.error || !payload.access_token) {
    // `error_description` puede citar el motivo, nunca un secreto; el token no aparece porque no lo hay.
    throw new GoogleOAuthError(
      payload.error ?? `http_${response.status}`,
      payload.error_description ?? 'Google ha rechazado la autorización.',
    );
  }

  return {
    accessToken: payload.access_token,
    // Google siempre lo manda; el suelo evita que un valor ausente cree una credencial nacida caducada.
    expiresIn:
      typeof payload.expires_in === 'number' && payload.expires_in > 0 ? payload.expires_in : 3600,
    scope: payload.scope ?? '',
    refreshToken: payload.refresh_token ?? null,
    idToken: payload.id_token ?? null,
  };
}
