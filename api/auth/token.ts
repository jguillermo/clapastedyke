/**
 * `POST /api/auth/token` — emite un token de acceso nuevo a partir de la cookie de sesión.
 *
 * **Esta ruta es el arreglo.** Es lo que corre en cada recarga y cada vez que el token de una hora
 * caduca: sin ventana emergente, sin gesto del usuario y sin depender de que tenga su sesión de
 * Google abierta. Lo único que hace falta es la cookie.
 *
 * `401` no es un fallo del servidor ni un error que mostrar: significa «hay que conectar a mano», y
 * el navegador lo traduce a `null` en `Authenticator.resume`.
 */
import { logger } from 'firebase-functions';
import { sendError, sendJson, type HttpRequest, type HttpResponse } from '../_common/http';
import { clearedSessionCookie, readCookie, SESSION_COOKIE } from '../_common/cookies';
import { oauthClient } from './config';
import { GoogleOAuthError, refreshAccessToken } from './google-oauth';
import { sessionPayload } from './payload';
import { forgetGrant, readGrant } from './sessions';
import type { RouteContext } from './context';

export async function handleToken(
  req: HttpRequest,
  res: HttpResponse,
  ctx: RouteContext,
): Promise<void> {
  const sid = readCookie(req.headers.cookie, SESSION_COOKIE);
  if (!sid) {
    // Ni siquiera se registra: es lo que pasa en cada visita de alguien que nunca ha conectado.
    sendError(res, 401, 'no_session', 'No hay sesión en este navegador.');
    return;
  }

  const grant = await readGrant(sid);
  if (!grant) {
    res.setHeader('Set-Cookie', clearedSessionCookie(ctx.secure));
    sendError(res, 401, 'no_session', 'La sesión ya no es válida.');
    return;
  }

  let tokens;
  try {
    tokens = await refreshAccessToken(grant.refreshToken, oauthClient());
  } catch (error) {
    if (error instanceof GoogleOAuthError && error.isInvalidGrant) {
      // La persona retiró el acceso desde su cuenta de Google (o la app sigue en «Testing» y Google
      // caducó el permiso a los 7 días). Reintentar no puede funcionar nunca: se olvida.
      logger.info('la concesión ya no vale, se olvida', { sub: grant.sub });
      await forgetGrant(grant.sub);
      res.setHeader('Set-Cookie', clearedSessionCookie(ctx.secure));
      sendError(res, 401, 'revoked', 'Se ha retirado el acceso. Vuelve a conectar la cuenta.');
      return;
    }

    const failure =
      error instanceof GoogleOAuthError ? error : new GoogleOAuthError('unknown', String(error));
    // La sesión NO se toca: esto es un fallo pasajero y el intento siguiente puede ir bien.
    logger.warn('no se ha podido renovar el token', { sub: grant.sub, code: failure.code });
    sendError(res, 502, failure.code, 'Google no ha podido renovar el acceso.');
    return;
  }

  // Al refrescar, Google repite el `scope`, pero si algún día no lo hiciera vale el de la concesión:
  // los permisos no cambian al renovar. Sin este respaldo, un `scope` vacío haría que el navegador
  // descartara un token perfectamente válido por «no trae el permiso de Drive».
  const scope = tokens.scope || grant.scope;

  sendJson(res, 200, sessionPayload(grant, tokens, scope));
}
