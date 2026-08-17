import { inject, Injectable } from '@angular/core';
import { Logger } from '@core/_common/logger/logger';
import { Account } from '../domain/entities/account';
import { Authentication, Authenticator } from '../domain/services/authenticator';
import { Credential } from '../domain/value-objects/credential';
import { DRIVE_FILE_PERMISSION, GoogleCodeClient } from './google-code-client';

/**
 * Autenticación contra **el backend de la propia app** (`api/auth`), que es quien custodia el
 * permiso duradero.
 *
 * ## Qué arregla
 *
 * Antes esto hablaba con Google directamente, con el modelo de token: cada reanudación abría una
 * ventana emergente. Como reanudar ocurre al **arrancar la página**, sin gesto del usuario, el
 * navegador bloqueaba esa ventana y la sesión se perdía en cada recarga.
 *
 * Ahora reanudar es **un POST de mismo origen**: sin ventana, sin gesto, y sin depender de que la
 * persona tenga su sesión de Google abierta. La única operación que sigue abriendo una ventana es
 * conectar por primera vez, que sí sale de un clic.
 *
 * ## Qué NO cambia
 *
 * La credencial sigue viviendo **solo en memoria** y durando una hora. Lo que ahora es duradero es
 * la capacidad de pedir otra, y eso vive en una cookie `HttpOnly` que este código no puede leer —
 * ni él ni un XSS.
 *
 * ## Por qué rutas relativas
 *
 * `/api/auth/…` lo reescribe Firebase Hosting a la función, así que para el navegador es **mismo
 * origen**: no hay CORS, no hay URL que configurar por ambiente y la cookie viaja sola. En
 * desarrollo lo replica el proxy de `ng serve`.
 */

const EXCHANGE_URL = '/api/auth/exchange';
const TOKEN_URL = '/api/auth/token';
const SIGN_OUT_URL = '/api/auth/sign-out';

/** Ninguna llamada puede quedarse colgada: una promesa que no resuelve congela `ResumeSession`. */
const TIMEOUT_MS = 15_000;

/** El lenguaje publicado de `api/auth`. Se declara aquí porque el front no importa de `api/`. */
interface SessionPayload {
  account: { id: string; email: string; name: string; pictureUrl: string | null };
  accessToken: string;
  expiresIn: number;
  scope: string;
}

@Injectable()
export class BackendAuthenticator extends Authenticator {
  private readonly codes = inject(GoogleCodeClient);
  private readonly log = inject(Logger).scoped('auth/backend');

  /**
   * Conectar: una ventana de Google (dentro del clic) para obtener el código, y el backend lo
   * canjea. Es el único momento de toda la vida de la sesión en que se le pide algo al usuario.
   */
  async authenticate(clientId: string): Promise<Authentication> {
    const code = await this.codes.requestCode(clientId);

    this.log.debug('canjeando el código en el backend');
    const response = await this.post(EXCHANGE_URL, { code });

    if (!response.ok) {
      throw new Error(await failureMessage(response));
    }

    const authentication = toAuthentication(await response.json());
    this.log.debug('sesión abierta', { accountId: authentication.account.id.value });
    return authentication;
  }

  /**
   * Reanudar es **solo esto**: pedirle un token al backend, que lo emite con el permiso duradero
   * que guarda. Ni carga el script de Google, ni abre nada, ni necesita el `clientId` ni la pista —
   * la identidad la pone la cookie. Los dos parámetros se conservan porque son del puerto, no de
   * este adaptador.
   *
   * `401` es el caso normal de quien no ha conectado nunca o cuya sesión ya no vale: **no es un
   * fallo** y no se registra como tal.
   */
  async resume(_clientId: string, _hint: string): Promise<Authentication | null> {
    this.log.debug('pidiendo un token al backend');

    let response: Response;
    try {
      response = await this.post(TOKEN_URL);
    } catch (error) {
      // A diferencia del flujo anterior, el error SÍ se liga: sin esto no había forma de saber por
      // qué no se reanudaba una sesión.
      this.log.debug('el backend no ha contestado, hará falta conectar a mano', { error });
      return null;
    }

    if (response.status === 401) {
      this.log.debug('el backend no tiene sesión para este navegador');
      return null;
    }
    if (!response.ok) {
      this.log.warn('el backend no ha podido renovar el acceso', await failureMessage(response));
      return null;
    }

    const authentication = toAuthentication(await response.json());
    if (!authentication.credential.allows(DRIVE_FILE_PERMISSION)) {
      this.log.warn('el token renovado no trae el permiso de Drive, se descarta');
      return null;
    }
    return authentication;
  }

  /**
   * Cerrar sesión. El backend revoca el permiso en Google y borra lo que guardaba; la credencial en
   * memoria la tira quien llama. No lanza aunque el backend falle: la sesión local se cierra igual.
   */
  async revoke(_credential: Credential): Promise<void> {
    try {
      await this.post(SIGN_OUT_URL);
      this.log.debug('permiso retirado en el backend');
    } catch (error) {
      this.log.warn('no se ha podido avisar al backend del cierre de sesión', error);
    }
  }

  /**
   * `credentials: 'include'` es lo que hace que viaje la cookie de sesión. Es mismo origen, así que
   * bastaría con el valor por defecto, pero declararlo evita que un cambio futuro de origen rompa
   * la reanudación en silencio.
   */
  private post(url: string, body?: unknown): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  }
}

function toAuthentication(raw: unknown): Authentication {
  const payload = raw as SessionPayload;
  const account = payload?.account;

  if (!account?.id || !account.email || !payload.accessToken) {
    throw new Error('El servicio de sesión ha devuelto una respuesta incompleta.');
  }

  return {
    account: Account.of(account.id, account.email, account.name, account.pictureUrl),
    credential: Credential.of(
      payload.accessToken,
      payload.expiresIn,
      (payload.scope ?? '').split(' ').filter((entry) => entry.length > 0),
      Date.now(),
    ),
  };
}

/** El mensaje del backend si lo trae; si no, uno que al menos diga qué pasó. */
async function failureMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) {
      return body.message;
    }
  } catch {
    // Un cuerpo ilegible no aporta nada; se cae al mensaje genérico.
  }
  return `El servicio de sesión ha respondido ${response.status}.`;
}
