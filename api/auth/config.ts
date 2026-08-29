/**
 * Los parámetros de la función `auth`: las dos mitades del cliente de OAuth.
 *
 * **Las dos son variables de entorno del `.env`**, y ninguna está versionada con su valor: el
 * fichero lleva MARCADORES (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`) y quien los
 * sustituye es el workflow de despliegue, sobre la copia que viaja en
 * `deploy/dist/functions/auth/`, sacando los dos valores del secret `GOOGLE_OAUTH_CLIENT` del
 * *environment*. En el repositorio nunca hay ni un Client ID ni un client secret.
 *
 * **Por qué el secreto NO va en Secret Manager.** `defineSecret` obliga al despliegue a llamar,
 * además de a Firebase, a Secret Manager y a Service Usage: dos APIs más que habilitar y dos
 * permisos más que conceder a la cuenta de servicio, solo para transportar un valor que el
 * despliegue ya tiene en la mano. Publicar la función pasa a depender de que un 403 de otra API no
 * ocurra. Como variable de entorno viaja con el artefacto y el deploy es exactamente eso: un deploy
 * de Firebase.
 *
 * El coste, dicho claro: una variable de entorno la ve cualquiera con permiso de lectura sobre la
 * función en la consola de Cloud, mientras que Secret Manager la habría guardado cifrada y con
 * bitácora de accesos. Es el intercambio que se acepta a cambio de un despliegue con una sola
 * dependencia. Rotarlo es regenerar el client secret en la consola de Google, actualizar el secret
 * `GOOGLE_OAUTH_CLIENT` del *environment* y volver a desplegar.
 *
 * El fichero es `.env` **sin sufijo de proyecto** a propósito: Firebase lo carga para cualquier
 * `--project`, así que un mismo artefacto sirve para todos los ambientes. En el emulador se queda
 * el marcador, salvo que pongas los valores en `api/auth/.env.local` (ignorado por git).
 */
import { defineString } from 'firebase-functions/params';

export const GOOGLE_OAUTH_CLIENT_ID = defineString('GOOGLE_OAUTH_CLIENT_ID');
export const GOOGLE_OAUTH_CLIENT_SECRET = defineString('GOOGLE_OAUTH_CLIENT_SECRET');

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
      'La función auth no está configurada: faltan GOOGLE_OAUTH_CLIENT_ID o ' +
        'GOOGLE_OAUTH_CLIENT_SECRET en el .env. Ver api/auth/README.md.',
    );
  }
  return { clientId, clientSecret };
}
