import { inject, Injectable } from '@angular/core';
import { Logger } from '@core/_common/logger/logger';
import { Account } from '../domain/entities/account';
import { AuthSettingsRepository } from '../domain/repositories/auth-settings.repository';
import { SessionTokenRepository } from '../domain/repositories/session-token.repository';
import { Authentication, Authenticator, ResumeOutcome } from '../domain/services/authenticator';
import { Credential } from '../domain/value-objects/credential';
import { DRIVE_FILE_PERMISSION, GoogleCodeClient } from './google-code-client';

/**
 * Autenticación contra **el backend de la propia app** (`firebase/functions`), que es quien custodia
 * el permiso duradero.
 *
 * ## Qué arregla
 *
 * Antes esto hablaba con Google directamente, con el modelo de token: cada reanudación abría una
 * ventana emergente. Como reanudar ocurre al **arrancar la página**, sin gesto del usuario, el
 * navegador bloqueaba esa ventana y la sesión se perdía en cada recarga.
 *
 * Ahora reanudar es **un POST**: sin ventana, sin gesto, y sin depender de que la persona tenga su
 * sesión de Google abierta. La única operación que sigue abriendo una ventana es conectar por
 * primera vez, que sí sale de un clic.
 *
 * ## Qué NO cambia
 *
 * La credencial de Google sigue viviendo **solo en memoria** y durando una hora. Lo duradero es la
 * capacidad de pedir otra, y esa vive en el servidor: aquí no hay ningún refresh token, ni lo habrá.
 *
 * ## Por qué URL absoluta, y no `/api/auth/…`
 *
 * La función **no** se sirve desde el mismo origen que la app: se llama directamente, con CORS. Su
 * dirección lleva dentro el proyecto y la región, así que cambia por ambiente y sale de
 * `public/config.json` (`authApiUrl`), no del bundle.
 *
 * ## Las dos vías por las que viaja la sesión
 *
 * El backend emite una cookie `HttpOnly` (`credentials: 'include'` la manda) **y** devuelve el mismo
 * identificador en el cuerpo. La cookie es la vía preferida —ni la app ni un XSS pueden leerla—,
 * pero al ser de otro dominio es una cookie de terceros, y Safari e iOS la bloquean. Por eso se
 * guarda el `session_token` y se manda en `Authorization` como respaldo. Sin él, en móvil la sesión
 * no sobreviviría a una recarga, que es justo lo que este backend viene a arreglar.
 */

/** Ninguna llamada puede quedarse colgada: una promesa que no resuelve congela `ResumeSession`. */
const TIMEOUT_MS = 15_000;

const UNREACHABLE: ResumeOutcome = { kind: 'unreachable' };
const INVALID: ResumeOutcome = { kind: 'invalid' };

/** El lenguaje publicado del backend. Se declara aquí porque el front no importa de `firebase/`. */
interface SessionPayload {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: 'Bearer';
  session_token: string;
  account: { sub: string; email: string; name: string; picture: string | null };
}

@Injectable()
export class BackendAuthenticator extends Authenticator {
  private readonly codes = inject(GoogleCodeClient);
  private readonly settings = inject(AuthSettingsRepository);
  private readonly sessionTokens = inject(SessionTokenRepository);
  private readonly log = inject(Logger).scoped('auth/backend');

  /** Lo único que `authenticate` no puede permitirse esperar dentro del clic. */
  prepare(): void {
    this.codes.preload();
  }

  /**
   * Conectar: una ventana de Google (dentro del clic) para obtener el código, y el backend lo
   * canjea. Es el único momento de toda la vida de la sesión en que se le pide algo al usuario.
   *
   * **El login no lo hace este método ni el backend**: lo hace Google en su propia ventana. Aquí solo
   * se recoge el código que Google emite después, y se manda a canjear.
   */
  async authenticate(clientId: string): Promise<Authentication> {
    const base = await this.settings.authApiUrl();
    if (!base) {
      throw new Error(
        'Falta la dirección del servicio de sesión en la configuración del despliegue ' +
          '(clave `authApiUrl` de config.json; ver manual/google-integration.md).',
      );
    }

    // AQUÍ está el login: una ventana de Google, en su dominio, donde la persona se identifica. La
    // app no ve la contraseña y no podría verla. Lo que vuelve es un código de un solo uso.
    const code = await this.codes.requestCode(clientId);

    // Y esto es lo único que el navegador no puede hacer solo: canjear ese código exige el
    // `client_secret`. De ahí que exista el backend, y de ahí el nombre de la ruta.
    this.log.debug('canjeando el código en el backend');
    const response = await this.post(`${base}/exchange`, { code });

    if (!response.ok) {
      throw new Error(await failureMessage(response));
    }

    const payload = await readPayload(response);
    // Se guarda ANTES de devolver: si la cookie no cuaja (Safari), esto es lo único que permitirá
    // reanudar, y perderlo aquí no daría ningún síntoma hasta la siguiente recarga.
    await this.sessionTokens.save(payload.session_token);

    const authentication = toAuthentication(payload);
    this.log.debug('sesión abierta', { accountId: authentication.account.id.value });
    return authentication;
  }

  /**
   * Reanudar es **solo esto**: pedirle un token al backend, que lo emite con el permiso duradero que
   * guarda. Ni carga el script de Google, ni abre nada, ni necesita saber con qué cuenta se estaba —
   * la identidad la ponen la cookie o el identificador guardado.
   *
   * ## Qué se considera «no te oigo» y qué «tu sesión no vale»
   *
   * Solo el `401` dice algo sobre la sesión: es el backend afirmando que no la reconoce. Todo lo
   * demás —red caída, tiempo agotado, Google sin contestar, despliegue sin dirección configurada— es
   * ignorancia nuestra, y tratarla como una expulsión echaría al usuario cada vez que entra en el
   * metro.
   */
  async resume(): Promise<ResumeOutcome> {
    const base = await this.settings.authApiUrl();
    if (!base) {
      this.log.debug('sin dirección del servicio de sesión, no se puede preguntar');
      return UNREACHABLE;
    }

    this.log.debug('pidiendo un token al backend');

    let response: Response;
    try {
      response = await this.post(`${base}/refresh`);
    } catch (error) {
      this.log.debug('el backend no ha contestado', { error });
      return UNREACHABLE;
    }

    if (response.status === 401) {
      this.log.debug('el backend no reconoce la sesión de este navegador');
      return INVALID;
    }
    if (!response.ok) {
      // Pasajero: la sesión del backend sigue viva y el intento siguiente puede ir bien.
      this.log.warn('el backend no ha podido renovar el acceso', await failureMessage(response));
      return UNREACHABLE;
    }

    const payload = await readPayload(response);
    // El backend repite el identificador al renovar; guardarlo cubre al navegador que lo hubiera
    // perdido pero conservara la cookie.
    await this.sessionTokens.save(payload.session_token);

    const authentication = toAuthentication(payload);
    if (!authentication.credential.allows(DRIVE_FILE_PERMISSION)) {
      // Sin el permiso de Drive el token no sirve para lo único que esta app hace con Google, así
      // que la sesión que lo respalda tampoco: hay que volver a consentir.
      this.log.warn('el token renovado no trae el permiso de Drive, se descarta');
      return INVALID;
    }
    return { kind: 'authenticated', authentication };
  }

  /**
   * Cierra en el backend la sesión de **este** navegador: borra su `sessions/{sid}` y vacía su
   * cookie. Ni toca las sesiones que esa persona tenga en otros dispositivos, ni retira su
   * autorización en Google.
   *
   * Que no se pueda contactar se **devuelve**, no se traga: quien llama tiene que poder negarse a
   * cerrar en local una sesión que quizá siga viva al otro lado.
   */
  async closeRemoteSession(): Promise<'closed' | 'unreachable'> {
    const base = await this.settings.authApiUrl();
    if (!base) {
      this.log.debug('sin dirección del servicio de sesión, no hay a quién avisar');
      return 'unreachable';
    }

    let response: Response;
    try {
      response = await this.post(`${base}/logout`);
    } catch (error) {
      this.log.debug('el backend no ha contestado al cierre de sesión', { error });
      return 'unreachable';
    }

    if (!response.ok) {
      // Sin confirmación no se puede dar por cerrada: quien llama va a borrar el dispositivo entero.
      this.log.warn('el backend no ha confirmado el cierre', await failureMessage(response));
      return 'unreachable';
    }

    this.log.debug('sesión cerrada en el backend');
    return 'closed';
  }

  /**
   * `credentials: 'include'` es lo que hace que viaje la cookie de sesión incluso siendo de otro
   * origen. Y `Authorization` es el respaldo para cuando el navegador la bloquea: mandar los dos no
   * cuesta nada, y el backend se queda con el que llegue.
   */
  private async post(url: string, body?: unknown): Promise<Response> {
    const sessionToken = await this.sessionTokens.read();
    const headers: Record<string, string> = {};

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }

    return fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  }
}

/** El cuerpo de una respuesta correcta, comprobando que trae lo mínimo para armar una sesión. */
async function readPayload(response: Response): Promise<SessionPayload> {
  const payload = (await response.json()) as SessionPayload;
  const account = payload?.account;

  if (!account?.sub || !account.email || !payload.access_token || !payload.session_token) {
    throw new Error('El servicio de sesión ha devuelto una respuesta incompleta.');
  }
  return payload;
}

function toAuthentication(payload: SessionPayload): Authentication {
  const { account } = payload;

  return {
    account: Account.of(account.sub, account.email, account.name, account.picture),
    credential: Credential.of(
      payload.access_token,
      payload.expires_in,
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
