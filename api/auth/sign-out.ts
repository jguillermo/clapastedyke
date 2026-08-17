/**
 * `POST /api/auth/sign-out` — retira el permiso y borra la sesión.
 *
 * **Siempre responde 204**, pase lo que pase. Cerrar sesión no puede fallar: si Google no contesta,
 * lo que importa —que este backend deje de poder actuar en nombre de esa persona— ya está hecho, y
 * devolver un error solo conseguiría que la pantalla dijera que sigue conectada cuando no lo está.
 *
 * Revocar en Google retira la **concesión entera**, así que también cierra la sesión de los demás
 * dispositivos. Es lo que hacía el flujo anterior (`google.accounts.oauth2.revoke`) y lo que la
 * gente espera de «desconectar mi cuenta».
 */
import { logger } from 'firebase-functions';
import { sendNoContent, type HttpRequest, type HttpResponse } from '../_common/http';
import { clearedSessionCookie, readCookie, SESSION_COOKIE } from '../_common/cookies';
import { revokeToken } from './google-oauth';
import { forgetGrant, readGrant } from './sessions';
import type { RouteContext } from './context';

export async function handleSignOut(
  req: HttpRequest,
  res: HttpResponse,
  ctx: RouteContext,
): Promise<void> {
  // La cookie se limpia lo primero: es lo único que el navegador se lleva de esta respuesta.
  res.setHeader('Set-Cookie', clearedSessionCookie(ctx.secure));

  const sid = readCookie(req.headers.cookie, SESSION_COOKIE);
  if (!sid) {
    sendNoContent(res);
    return;
  }

  try {
    const grant = await readGrant(sid);
    if (grant) {
      const revoked = await revokeToken(grant.refreshToken);
      await forgetGrant(grant.sub);
      logger.info('sesión cerrada', { sub: grant.sub, revoked });
    }
  } catch (error) {
    // Se registra y se sigue: la cookie ya está limpia y el usuario queda desconectado igual.
    logger.warn('no se ha podido completar el cierre de sesión en el servidor', error);
  }

  sendNoContent(res);
}
