/**
 * `POST /api/auth/exchange` — convierte el código de autorización en una sesión.
 *
 * Es la **única** ruta que exige un gesto del usuario al otro lado: el código llega de la ventana de
 * Google que abrió el clic en «Conectar». Todo lo demás (recargar, la caducidad de cada hora) pasa
 * ya por `/auth/token`, sin ventana.
 */
import { logger } from 'firebase-functions';
import {
  jsonBody,
  requiredString,
  sendError,
  sendJson,
  type HttpRequest,
  type HttpResponse,
} from '../_common/http';
import { sessionCookie } from '../_common/cookies';
import { oauthClient } from './config';
import {
  DRIVE_FILE_PERMISSION,
  exchangeCode,
  grants,
  GoogleOAuthError,
  readProfile,
} from './google-oauth';
import { sessionPayload } from './payload';
import { openSession, storedRefreshToken } from './sessions';
import type { RouteContext } from './context';

export async function handleExchange(
  req: HttpRequest,
  res: HttpResponse,
  ctx: RouteContext,
): Promise<void> {
  const code = requiredString(jsonBody(req.body), 'code');
  if (!code) {
    sendError(res, 400, 'invalid_request', 'Falta el código de autorización.');
    return;
  }

  let tokens;
  try {
    tokens = await exchangeCode(code, oauthClient());
  } catch (error) {
    const failure =
      error instanceof GoogleOAuthError ? error : new GoogleOAuthError('unknown', String(error));
    // El código nunca se registra: es de un solo uso, pero sigue siendo una credencial.
    logger.warn('el canje del código ha fallado', { code: failure.code });
    sendError(res, 502, failure.code, 'Google ha rechazado la autorización.');
    return;
  }

  const profile = readProfile(tokens.idToken);
  if (!profile) {
    logger.warn('el canje no ha devuelto un perfil utilizable');
    sendError(res, 502, 'no_profile', 'Google no ha identificado la cuenta.');
    return;
  }

  // Mismo criterio que aplicaba el navegador, ahora antes de guardar nada: una concesión sin el
  // permiso de Drive no sirve para lo único que esta app hace con Google.
  if (!grants(tokens.scope, DRIVE_FILE_PERMISSION)) {
    logger.warn('concesión sin el permiso de Drive', { sub: profile.sub });
    sendError(
      res,
      403,
      'missing_permission',
      'No has concedido el permiso para crear la hoja en tu Drive. Vuelve a conectar y acepta la casilla.',
    );
    return;
  }

  // Google solo reemite el refresh token en la primera autorización; si esta cuenta ya tenía uno
  // guardado, se conserva. Ver `storedRefreshToken`.
  const refreshToken = tokens.refreshToken ?? (await storedRefreshToken(profile.sub));
  if (!refreshToken) {
    logger.warn('Google no ha entregado refresh token y no había ninguno guardado', {
      sub: profile.sub,
    });
    sendError(
      res,
      409,
      'no_refresh_token',
      'Google no ha entregado un permiso duradero. Retira el acceso de esta app en tu cuenta de Google y vuelve a conectar.',
    );
    return;
  }

  const sid = await openSession(profile, refreshToken, tokens.scope);
  res.setHeader('Set-Cookie', sessionCookie(sid, ctx.secure));
  logger.info('sesión abierta', { sub: profile.sub });

  sendJson(res, 200, sessionPayload(profile, tokens, tokens.scope));
}
