/**
 * Los parámetros de la función `auth`.
 *
 * **El secreto vive en Secret Manager, nunca en el repositorio**:
 * `firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_SECRET --project <projectId>`.
 * En el emulador se lee de `api/auth/.secret.local`, que está en el `.gitignore`.
 *
 * **El Client ID no es un secreto** (viaja en cada petición del navegador), así que va en un `.env`
 * **versionado** — pero no con su valor: con el MARCADOR `GOOGLE_OAUTH_CLIENT_ID`. Quien lo
 * sustituye es el workflow de despliegue, sobre la copia que viaja en
 * `deploy/dist/functions/auth/`, sacándolo del `web.client_id` del secret `GOOGLE_OAUTH_CLIENT`.
 * En el repositorio nunca hay un Client ID.
 *
 * El fichero es `.env` **sin sufijo de proyecto** a propósito: Firebase lo carga para cualquier
 * `--project`, así que un mismo artefacto sirve para todos los ambientes.
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
      'La función auth no está configurada: faltan GOOGLE_OAUTH_CLIENT_ID (.env) ' +
        'o GOOGLE_OAUTH_CLIENT_SECRET (Secret Manager). Ver api/auth/README.md.',
    );
  }
  return { clientId, clientSecret };
}
