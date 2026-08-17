/**
 * Lo único que este backend guarda: la concesión de cada persona y las sesiones abiertas.
 *
 * ```
 * users/{sub}       ← la concesión de Google: refresh token, permisos y perfil
 * sessions/{sid}    ← una por navegador; su id es lo que va dentro de la cookie `__session`
 * ```
 *
 * ## Por qué dos colecciones y no una
 *
 * El identificador que viaja en la cookie **no puede ser el `sub` de Google**: es adivinable, es
 * estable para siempre y se reutiliza en cualquier otro sitio donde esa persona entre con Google.
 * El `sid` es opaco, aleatorio, caduca y se puede tirar sin tocar la concesión. Separarlos también
 * permite que un mismo usuario tenga varias sesiones (móvil y ordenador) sobre un solo refresh
 * token.
 *
 * ## Lo que NUNCA sale de aquí
 *
 * El refresh token no se devuelve al navegador en ninguna respuesta, no se registra y no aparece en
 * ningún mensaje de error. Es lo único de verdad valioso que custodia este servicio.
 */
import { randomUUID } from 'node:crypto';
import { firestore } from './firestore';
import { SESSION_MAX_AGE_SECONDS } from '../_common/cookies';
import type { GoogleProfile } from './google-oauth';

const USERS = 'users';
const SESSIONS = 'sessions';

export interface StoredGrant {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
  refreshToken: string;
  scope: string;
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
  const user = await firestore().collection(USERS).doc(sub).get();
  const refreshToken = user.get('refreshToken') as unknown;
  return typeof refreshToken === 'string' && refreshToken ? refreshToken : null;
}

/** Abre sesión para una concesión recién obtenida y devuelve el id que va en la cookie. */
export async function openSession(
  profile: GoogleProfile,
  refreshToken: string,
  scope: string,
): Promise<string> {
  const db = firestore();
  const now = Date.now();
  const sid = randomUUID();

  await db.collection(USERS).doc(profile.sub).set(
    {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      refreshToken,
      scope,
      updatedAt: now,
    },
    // `merge` para no perder `createdAt` cuando alguien vuelve a conectar la misma cuenta.
    { merge: true },
  );

  await db
    .collection(SESSIONS)
    .doc(sid)
    .set({ sub: profile.sub, createdAt: now, expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000 });

  return sid;
}

/**
 * La concesión detrás de una cookie, o `null` si la sesión no existe, caducó, o su usuario ya no
 * tiene refresh token (le retiraron el acceso).
 *
 * Una sesión caducada **se borra al leerla**: es la limpieza que hace falta si no se configura una
 * política TTL en Firestore, y no cuesta nada porque ya estamos en el documento.
 */
export async function readGrant(sid: string): Promise<StoredGrant | null> {
  const db = firestore();
  const session = await db.collection(SESSIONS).doc(sid).get();
  if (!session.exists) {
    return null;
  }

  const expiresAt = session.get('expiresAt') as unknown;
  if (typeof expiresAt === 'number' && expiresAt <= Date.now()) {
    await session.ref.delete();
    return null;
  }

  const sub = session.get('sub') as unknown;
  if (typeof sub !== 'string' || !sub) {
    await session.ref.delete();
    return null;
  }

  const user = await db.collection(USERS).doc(sub).get();
  const refreshToken = user.get('refreshToken') as unknown;
  if (!user.exists || typeof refreshToken !== 'string' || !refreshToken) {
    return null;
  }

  return {
    sub,
    email: (user.get('email') as string | undefined) ?? '',
    name: (user.get('name') as string | undefined) ?? '',
    picture: (user.get('picture') as string | null | undefined) ?? null,
    refreshToken,
    scope: (user.get('scope') as string | undefined) ?? '',
  };
}

/**
 * Olvida la concesión de una persona **y todas sus sesiones**.
 *
 * Se llama en dos sitios y por el mismo motivo: al cerrar sesión (se revoca en Google) y cuando
 * Google responde `invalid_grant` (ya no vale). Dejar el refresh token muerto en Firestore solo
 * conseguiría que cada recarga volviera a pedírselo a Google para volver a fallar.
 */
export async function forgetGrant(sub: string): Promise<void> {
  const db = firestore();
  const sessions = await db.collection(SESSIONS).where('sub', '==', sub).get();

  const batch = db.batch();
  for (const session of sessions.docs) {
    batch.delete(session.ref);
  }
  batch.delete(db.collection(USERS).doc(sub));
  await batch.commit();
}
