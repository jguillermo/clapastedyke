/**
 * Los parámetros de la función `auth`.
 *
 * **El secreto vive en Secret Manager, nunca en el repositorio**:
 * `firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_SECRET --project <projectId>`.
 * En el emulador se lee de `api/auth/.secret.local`, que está en el `.gitignore`.
 *
 * **El Client ID no es un secreto** (viaja en cada petición del navegador), así que va en un
 * `.env.<projectId>` versionado. Tiene que ser **el mismo** que el `googleClientId` del ambiente en
 * `deploy/firebase/environments.json`: si no coinciden, Google rechaza el canje con
 * `invalid_client` y no hay forma de deducirlo del mensaje.
 */
import { defineSecret, defineString } from 'firebase-functions/params';

export const GOOGLE_OAUTH_CLIENT_ID = defineString('GOOGLE_OAUTH_CLIENT_ID');
export const GOOGLE_OAUTH_CLIENT_SECRET = defineSecret('GOOGLE_OAUTH_CLIENT_SECRET');

export interface OAuthClient {
  clientId: string;
  clientSecret: string;
}

/**
 * Se leen **dentro del manejador**, nunca al cargar el módulo: los parámetros de Firebase no tienen
 * valor hasta que la función está en ejecución, y leerlos antes devuelve la cadena vacía.
 */
export function oauthClient(): OAuthClient {
  const clientId = GOOGLE_OAUTH_CLIENT_ID.value();
  const clientSecret = GOOGLE_OAUTH_CLIENT_SECRET.value();

  if (!clientId || !clientSecret) {
    throw new Error(
      'La función auth no está configurada: faltan GOOGLE_OAUTH_CLIENT_ID (.env.<projectId>) ' +
        'o GOOGLE_OAUTH_CLIENT_SECRET (Secret Manager). Ver api/auth/README.md.',
    );
  }
  return { clientId, clientSecret };
}
