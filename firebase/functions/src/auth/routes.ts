/**
 * Las tres operaciones de la sesión.
 *
 * ```
 * POST /exchange { code }   → canjea el código, guarda el refresh token y devuelve un access token
 * POST /refresh             → access token nuevo desde el sid. Sin ventana, sin gesto
 * POST /logout              → cierra ESTA sesión y limpia la cookie
 * ```
 *
 * ## CRITICAL: aquí NO se autentica a nadie
 *
 * El login ocurre **en la ventana de Google**, en `accounts.google.com`, antes de que esta función se
 * entere de que existe alguien. La app no ve la contraseña y no podría verla: es otro origen y el
 * navegador lo aísla.
 *
 * Lo que llega a `/exchange` es un **código de un solo uso** que Google ya emitió, y que por sí solo
 * no abre nada. La ruta se llama `exchange` y no `login` justo por eso: lo único que hace es
 * canjearlo — y **eso** es lo que el navegador no puede hacer solo, porque canjear exige el
 * `client_secret`. Ahí está toda la razón de ser de este backend.
 *
 * Solo `/exchange` necesita un gesto del usuario al otro lado (el clic que abrió la ventana). Todo lo
 * demás —recargar, la caducidad de cada hora— pasa por `/refresh`, sin ventana ninguna.
 */
import * as logger from "firebase-functions/logger";
import {
  jsonBody,
  oauthClient,
  requiredString,
  sendError,
  sendJson,
  sendNoContent,
  sessionPayload,
} from "./http";
import type {HttpRequest, HttpResponse} from "./http";
import {
  DRIVE_FILE_PERMISSION,
  exchangeCode,
  GoogleOAuthError,
  grants,
  readProfile,
  refreshAccessToken,
} from "./google";
import {
  clearedSessionCookie,
  closeSession,
  extendSession,
  forgetGrant,
  openSession,
  readGrant,
  readSessionId,
  sessionCookie,
  storedRefreshToken,
} from "./sessions";

/** `secure` decide los atributos de la cookie; sale de `isSecure(req)` en el router. */
export type Route = (req: HttpRequest, res: HttpResponse, secure: boolean) => Promise<void>;

// ─── POST /exchange ──────────────────────────────────────────────────────────────────────────────

export const handleExchange: Route = async (req, res, secure) => {
  const code = requiredString(jsonBody(req.body), "code");
  if (!code) {
    sendError(res, 400, "invalid_request", "Falta el código de autorización.");
    return;
  }

  let tokens;
  try {
    tokens = await exchangeCode(code, oauthClient());
  } catch (error) {
    const failure = asOAuthError(error);
    // El código nunca se registra: es de un solo uso, pero sigue siendo una credencial.
    logger.warn("el canje del código ha fallado", {code: failure.code});
    sendError(res, 502, failure.code, "Google ha rechazado la autorización.");
    return;
  }

  const profile = readProfile(tokens.idToken);
  if (!profile) {
    logger.warn("el canje no ha devuelto un perfil utilizable");
    sendError(res, 502, "no_profile", "Google no ha identificado la cuenta.");
    return;
  }

  // Antes de guardar nada: una concesión sin el permiso de Drive no sirve para lo único que esta app
  // hace con Google, y aceptarla dejaría una sesión que falla mucho más tarde y sin relación visible
  // con la causa. Cualquier permiso nuevo que se añada necesita su comprobación equivalente.
  if (!grants(tokens.scope, DRIVE_FILE_PERMISSION)) {
    logger.warn("concesión sin el permiso de Drive", {sub: profile.sub});
    sendError(
      res,
      403,
      "missing_permission",
      "No has concedido el permiso para crear la hoja en tu Drive. " +
        "Vuelve a conectar y acepta la casilla.",
    );
    return;
  }

  // Google solo reemite el refresh token en la primera autorización; si esta cuenta ya tenía uno
  // guardado, se conserva. Ver `storedRefreshToken`.
  const refreshToken = tokens.refreshToken ?? (await storedRefreshToken(profile.sub));
  if (!refreshToken) {
    logger.warn("Google no ha entregado refresh token y no había ninguno guardado", {
      sub: profile.sub,
    });
    sendError(
      res,
      409,
      "no_refresh_token",
      "Google no ha entregado un permiso duradero. Retira el acceso de esta app en tu cuenta de " +
        "Google y vuelve a conectar.",
    );
    return;
  }

  const sid = await openSession(profile, refreshToken, tokens.scope);
  res.setHeader("Set-Cookie", sessionCookie(sid, secure));
  logger.info("sesión abierta", {sub: profile.sub});

  sendJson(res, 200, sessionPayload(profile, tokens, tokens.scope, sid));
};

// ─── POST /refresh ───────────────────────────────────────────────────────────────────────────────

/**
 * **Esta ruta es el arreglo.** Corre en cada recarga y cada vez que el token de una hora caduca: sin
 * ventana emergente, sin gesto del usuario y sin depender de que tenga su sesión de Google abierta.
 *
 * Además **alarga la sesión**: usarla es lo que la mantiene viva, así que los 180 días miden
 * inactividad y no antigüedad.
 *
 * `401` no es un fallo del servidor ni un error que mostrar: es lo único que autoriza al navegador a
 * olvidar su sesión. Cualquier otro desenlace —incluido este servicio sin contestar— lo trata como
 * «no se ha podido preguntar», y la sesión sigue en pie. Ver `ResumeOutcome` en el navegador.
 */
export const handleRefresh: Route = async (req, res, secure) => {
  const sid = readSessionId(req);
  if (!sid) {
    // Ni siquiera se registra: es lo que pasa en cada visita de alguien que nunca ha conectado.
    sendError(res, 401, "no_session", "No hay sesión en este navegador.");
    return;
  }

  const grant = await readGrant(sid);
  if (!grant) {
    res.setHeader("Set-Cookie", clearedSessionCookie(secure));
    sendError(res, 401, "no_session", "La sesión ya no es válida.");
    return;
  }

  let tokens;
  try {
    tokens = await refreshAccessToken(grant.refreshToken, oauthClient());
  } catch (error) {
    if (error instanceof GoogleOAuthError && error.isInvalidGrant) {
      // La persona retiró el acceso desde su cuenta de Google (o la app sigue en «Testing» y Google
      // caducó el permiso a los 7 días). Reintentar no puede funcionar nunca: se olvida.
      logger.info("la concesión ya no vale, se olvida", {sub: grant.sub});
      await forgetGrant(grant.sub);
      res.setHeader("Set-Cookie", clearedSessionCookie(secure));
      sendError(res, 401, "revoked", "Se ha retirado el acceso. Vuelve a conectar la cuenta.");
      return;
    }

    // La sesión NO se toca: esto es un fallo pasajero y el intento siguiente puede ir bien.
    const failure = asOAuthError(error);
    logger.warn("no se ha podido renovar el token", {sub: grant.sub, code: failure.code});
    sendError(res, 502, failure.code, "Google no ha podido renovar el acceso.");
    return;
  }

  // Al refrescar, Google repite el `scope`, pero si algún día no lo hiciera vale el de la concesión:
  // los permisos no cambian al renovar. Sin este respaldo, un `scope` vacío haría que el navegador
  // descartara un token perfectamente válido por «no trae el permiso de Drive».
  const scope = tokens.scope || grant.scope;

  await keepSessionAlive(sid, res, secure);

  // El `sid` no rota al renovar: es la misma sesión. Se repite en el payload para que un navegador
  // que hubiera perdido lo guardado pueda recuperarlo sin volver a conectar.
  sendJson(res, 200, sessionPayload(grant, tokens, scope, sid));
};

/**
 * La sesión se acaba de usar, así que su plazo vuelve a empezar: en Firestore y en la cookie del
 * navegador, que tienen que caducar a la vez.
 *
 * Un fallo aquí no puede tumbar la respuesta. El usuario ya tiene su token y la sesión sigue siendo
 * válida; lo único que se pierde es haber movido la fecha, y el refresco siguiente lo reintenta.
 */
async function keepSessionAlive(sid: string, res: HttpResponse, secure: boolean): Promise<void> {
  res.setHeader("Set-Cookie", sessionCookie(sid, secure));
  try {
    await extendSession(sid);
  } catch (error) {
    logger.warn("no se ha podido alargar la sesión", error);
  }
}

// ─── POST /logout ────────────────────────────────────────────────────────────────────────────────

/**
 * **Siempre responde 204**, pase lo que pase. Cerrar sesión no puede fallar: si Firestore no
 * contesta, la cookie ya está limpia y el navegador queda desconectado igual; devolver un error solo
 * conseguiría que la pantalla dijera que sigue conectada cuando no lo está.
 *
 * No revoca el permiso en Google y no borra `users/{sub}`: cerrar sesión aquí es cerrar **esta**
 * sesión, no retirarle la autorización a la app.
 */
export const handleLogout: Route = async (req, res, secure) => {
  // La cookie se limpia lo primero: es lo único que el navegador se lleva de esta respuesta, y tiene
  // que irse aunque todo lo demás falle.
  res.setHeader("Set-Cookie", clearedSessionCookie(secure));

  const sid = readSessionId(req);
  if (!sid) {
    sendNoContent(res);
    return;
  }

  try {
    await closeSession(sid);
    logger.info("sesión cerrada");
  } catch (error) {
    // Se registra y se sigue: el navegador queda desconectado igual, y la sesión huérfana caducará
    // sola a los 180 días.
    logger.warn("no se ha podido borrar la sesión", error);
  }

  sendNoContent(res);
};

/** Un fallo cualquiera visto como fallo de OAuth, para poder nombrarlo en la respuesta. */
function asOAuthError(error: unknown): GoogleOAuthError {
  return error instanceof GoogleOAuthError ?
    error :
    new GoogleOAuthError("unknown", String(error));
}
