/**
 * La sesión: qué se guarda, y cómo el navegador dice cuál es la suya.
 *
 * ```
 * users/{sub}       ← la concesión de Google: refresh token, permisos y perfil
 * sessions/{sid}    ← una por navegador; su id va en la cookie __session Y en el session_token
 * ```
 *
 * ## Por qué dos colecciones y no una
 *
 * El identificador que viaja al navegador **no puede ser el `sub` de Google**: es adivinable, es
 * estable para siempre y se reutiliza en cualquier otro sitio donde esa persona entre con Google. El
 * `sid` es opaco, aleatorio, caduca y se puede tirar sin tocar la concesión. Separarlos también
 * permite que un mismo usuario tenga varias sesiones (móvil y ordenador) sobre un solo refresh
 * token, que es justo lo que hace que cerrar sesión en uno no eche a los demás.
 *
 * ## CRITICAL: lo que NUNCA sale de aquí
 *
 * El refresh token no se devuelve al navegador en ninguna respuesta, no se registra y no aparece en
 * ningún mensaje de error. Es lo único de verdad valioso que custodia este servicio — y al navegador
 * no le serviría de nada, porque renovar con él exige el `client_secret`.
 */
import {randomUUID} from "node:crypto";
import {getApps, initializeApp} from "firebase-admin/app";
import {getFirestore, type Firestore} from "firebase-admin/firestore";
import type {GoogleProfile} from "./google";
import type {HttpRequest} from "./http";

const USERS = "users";
const SESSIONS = "sessions";

export const SESSION_COOKIE = "__session";

/**
 * Seis meses **de inactividad**, no de vida: cada `/refresh` vuelve a empezar la cuenta (ver
 * {@link extendSession}). A quien usa la app no se le pide reconectar nunca; a quien la abandona, sí.
 */
export const SESSION_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

/** La concesión de una persona, tal como la necesita quien renueva un token. */
export interface StoredGrant {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
  refreshToken: string;
  scope: string;
}

// ─── La cookie y su respaldo ─────────────────────────────────────────────────────────────────────

/**
 * ## Por qué la cookie se llama `__session`
 *
 * Firebase Hosting **borra todas las cookies entrantes menos `__session`** antes de pasar la
 * petición a una función. Hoy la app llama a la URL directa y Hosting no está en medio, así que
 * daría igual — pero el día que se ponga un rewrite delante, cualquier otro nombre dejaría de llegar
 * y la sesión no se reanudaría nunca. El nombre no cuesta nada y cierra esa puerta.
 *
 * ## Por qué `HttpOnly`
 *
 * Es lo único que impide que un XSS lea el identificador de sesión.
 *
 * ## CRITICAL: los atributos dependen del protocolo, y no es cosmética
 *
 * La función vive en otro dominio que la app, así que la cookie es **de terceros** y necesita
 * `SameSite=None`. La especificación exige que toda cookie `SameSite=None` lleve además `Secure`, y
 * `Secure` sobre `http://` el navegador simplemente no la guarda. En el emulador, que sirve por
 * http, eso haría imposible probar el ciclo entero en local.
 *
 * | Protocolo | Atributos | Dónde |
 * |---|---|---|
 * | https | `SameSite=None; Secure` | Cualquier despliegue |
 * | http  | `SameSite=Lax` (sin `Secure`) | Solo el emulador en local |
 *
 * Aun así, **Safari e iOS bloquean las cookies de terceros aunque estén bien formadas**. Por eso la
 * sesión no depende solo de esto: la respuesta lleva el mismo `sid` como `session_token`, la app lo
 * guarda y lo manda en `Authorization`. Ver {@link readSessionId}.
 */
export function sessionCookie(
  sid: string,
  secure: boolean,
  maxAgeSeconds = SESSION_MAX_AGE_SECONDS,
): string {
  return cookieAttributes(`${SESSION_COOKIE}=${encodeURIComponent(sid)}`, secure, maxAgeSeconds);
}

/** La misma cookie con `Max-Age=0`: es la única forma de borrarla desde el servidor. */
export function clearedSessionCookie(secure: boolean): string {
  return cookieAttributes(`${SESSION_COOKIE}=`, secure, 0);
}

function cookieAttributes(pair: string, secure: boolean, maxAgeSeconds: number): string {
  const parts = [pair, "Path=/", "HttpOnly", `Max-Age=${maxAgeSeconds}`];
  // `SameSite=None` SIN `Secure` lo rechaza el navegador, así que en http se cae a `Lax`. Es
  // suficiente en local, donde app y emulador se ven como el mismo sitio a efectos prácticos.
  parts.push(secure ? "SameSite=None; Secure" : "SameSite=Lax");
  return parts.join("; ");
}

/**
 * El identificador de sesión que trae la petición, mire donde mire.
 *
 * Primero la cookie; si no vino —Safari, iOS, o un navegador con las cookies de terceros
 * bloqueadas—, la cabecera `Authorization: Bearer <session_token>`. Que existan las dos vías es todo
 * lo que separa «la sesión sobrevive a una recarga» de «no sobrevive» en medio parque de
 * navegadores, y la app es principalmente móvil.
 */
export function readSessionId(req: HttpRequest): string | null {
  return readCookie(req.headers.cookie, SESSION_COOKIE) ?? readBearer(req.headers.authorization);
}

/** Lee una cookie de la cabecera `Cookie` cruda. `null` si no está o viene vacía. */
export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) {
    return null;
  }
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
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

/** El valor de `Authorization: Bearer <token>`, o `null`. El esquema no distingue mayúsculas. */
export function readBearer(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const [scheme, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer") {
    return null;
  }
  const token = rest.join(" ").trim();
  return token.length > 0 ? token : null;
}

// ─── Firestore ───────────────────────────────────────────────────────────────────────────────────

let cachedDb: Firestore | null = null;

/**
 * Se inicializa **una sola vez por instancia** y de forma perezosa: mientras nadie toque Firestore
 * no se paga el arranque del Admin SDK. `initializeApp()` sin argumentos toma las credenciales del
 * entorno de ejecución (y las del emulador en local), así que no hay ninguna clave que custodiar.
 *
 * Las reglas de seguridad (`firebase/firestore.rules`) **deniegan todo**: aquí solo llega el Admin
 * SDK, que se las salta por diseño. Eso es lo que impide que alguien con el `projectId` lea los
 * refresh tokens desde el SDK de cliente.
 */
function db(): Firestore {
  if (cachedDb) {
    return cachedDb;
  }
  if (getApps().length === 0) {
    initializeApp();
  }
  cachedDb = getFirestore();
  return cachedDb;
}

/**
 * El refresh token que ya se guardó para esta persona, si lo hay.
 *
 * Hace falta porque **Google no siempre reemite el refresh token**: lo entrega en la primera
 * autorización, y en las siguientes puede devolver solo un token de acceso si la concesión sigue
 * viva. Sin esta consulta, volver a pulsar «Conectar» con la misma cuenta borraría el refresh token
 * que sí teníamos y dejaría la sesión sin poder renovarse — el bug original, con otra ropa.
 */
export async function storedRefreshToken(sub: string): Promise<string | null> {
  const user = await db().collection(USERS).doc(sub).get();
  const refreshToken = user.get("refreshToken") as unknown;
  return typeof refreshToken === "string" && refreshToken ? refreshToken : null;
}

/** Abre sesión para una concesión recién obtenida y devuelve el `sid` que verá el navegador. */
export async function openSession(
  profile: GoogleProfile,
  refreshToken: string,
  scope: string,
): Promise<string> {
  const now = Date.now();
  const sid = randomUUID();

  await db().collection(USERS).doc(profile.sub).set(
    {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      refreshToken,
      scope,
      updatedAt: now,
    },
    // `merge` para no perder lo que hubiera cuando alguien vuelve a conectar la misma cuenta.
    {merge: true},
  );

  await db()
    .collection(SESSIONS)
    .doc(sid)
    .set({sub: profile.sub, createdAt: now, expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000});

  return sid;
}

/**
 * La concesión detrás de un `sid`, o `null` si la sesión no existe, caducó, o su usuario ya no tiene
 * refresh token (le retiraron el acceso).
 *
 * Una sesión caducada **se borra al leerla**: es la limpieza que hace falta si no se configura una
 * política TTL en Firestore, y no cuesta nada porque ya estamos en el documento.
 */
export async function readGrant(sid: string): Promise<StoredGrant | null> {
  const session = await db().collection(SESSIONS).doc(sid).get();
  if (!session.exists) {
    return null;
  }

  const expiresAt = session.get("expiresAt") as unknown;
  if (typeof expiresAt === "number" && expiresAt <= Date.now()) {
    await session.ref.delete();
    return null;
  }

  const sub = session.get("sub") as unknown;
  if (typeof sub !== "string" || !sub) {
    await session.ref.delete();
    return null;
  }

  const user = await db().collection(USERS).doc(sub).get();
  const refreshToken = user.get("refreshToken") as unknown;
  if (!user.exists || typeof refreshToken !== "string" || !refreshToken) {
    return null;
  }

  return {
    sub,
    email: (user.get("email") as string | undefined) ?? "",
    name: (user.get("name") as string | undefined) ?? "",
    picture: (user.get("picture") as string | null | undefined) ?? null,
    refreshToken,
    scope: (user.get("scope") as string | undefined) ?? "",
  };
}

/**
 * Aleja la caducidad de una sesión que se acaba de usar.
 *
 * Sin esto, los 180 días corren desde que se conectó y la sesión muere aunque se use a diario: a
 * alguien que abre la app cada mañana se le pediría reconectar cada seis meses sin motivo. Con esto,
 * el plazo mide **inactividad**, que es lo que se quería medir desde el principio.
 *
 * No devuelve nada ni lanza hacia fuera: quien la llama ya tiene el token del usuario en la mano, y
 * fallar por no haber podido mover una fecha sería cambiar un éxito por un error.
 */
export async function extendSession(sid: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  await db().collection(SESSIONS).doc(sid).update({expiresAt});
}

/**
 * Cierra **una** sesión: la de este navegador. Es lo que hace `/logout`.
 *
 * La concesión (`users/{sub}`) se queda, y con ella el refresh token: los demás dispositivos de esa
 * persona siguen conectados. Retirar de verdad el permiso en Google es otra cosa, y no se hace desde
 * aquí — quien quiera eso lo hace desde su cuenta de Google.
 */
export async function closeSession(sid: string): Promise<void> {
  await db().collection(SESSIONS).doc(sid).delete();
}

/**
 * Olvida la concesión de una persona **y todas sus sesiones**.
 *
 * Se llama en un solo sitio y por un solo motivo: Google respondió `invalid_grant`, o sea que el
 * refresh token ya no vale. Dejarlo muerto en Firestore solo conseguiría que cada recarga volviera a
 * pedírselo a Google para volver a fallar.
 */
export async function forgetGrant(sub: string): Promise<void> {
  const database = db();
  const sessions = await database.collection(SESSIONS).where("sub", "==", sub).get();

  const batch = database.batch();
  for (const session of sessions.docs) {
    batch.delete(session.ref);
  }
  batch.delete(database.collection(USERS).doc(sub));
  await batch.commit();
}
