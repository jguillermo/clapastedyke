import { inject, Injectable } from '@angular/core';
import { Logger } from '@core/_common/logger/logger';
import { Account } from '../domain/entities/account';
import { Authentication, Authenticator } from '../domain/services/authenticator';
import { Credential } from '../domain/value-objects/credential';

/**
 * Autenticación con **Google** (Google Identity Services, modelo de token).
 *
 * Este es el ÚNICO fichero del contexto que sabe que el proveedor es Google: el nombre de la
 * librería, sus tipos, los scopes y el endpoint del perfil viven aquí y no salen. Cambiar de
 * proveedor es escribir otro `Authenticator` y cambiar una línea en `auth.providers.ts`.
 *
 * Dos decisiones que importan:
 *
 * - **`prompt: 'select_account'` siempre.** Es lo que garantiza que el usuario pueda elegir cuenta y,
 *   por tanto, cambiar de cuenta. Con el comportamiento por defecto Google reutilizaría en silencio
 *   la última sesión del navegador.
 * - **El permiso que se pide es el más estrecho que sirve** (`drive.file`): solo alcanza los ficheros
 *   que crea la propia app, así que Google lo considera no sensible y no exige verificación.
 */

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

/** Permiso sin el cual no se puede crear ni escribir la hoja de cálculo del usuario. */
export const DRIVE_FILE_PERMISSION = 'https://www.googleapis.com/auth/drive.file';

const SCOPES = ['openid', 'email', 'profile', DRIVE_FILE_PERMISSION].join(' ');

// Tipado mínimo de GIS, escrito a mano: `tsconfig.app.json` declara `"types": []` (sin tipos
// ambientales) y de toda la librería aquí solo se usa el modelo de token.
interface TokenResponse {
  access_token?: string;
  expires_in?: number | string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GoogleIdentityApi {
  accounts: {
    oauth2: {
      initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: { type?: string; message?: string }) => void;
      }): { requestAccessToken(overrides?: { prompt?: string }): void };
      revoke(accessToken: string, done: () => void): void;
    };
  };
}

interface UserInfoResponse {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
}

@Injectable()
export class GoogleAuthenticator extends Authenticator {
  private readonly log = inject(Logger).scoped('auth/google');

  private loading: Promise<GoogleIdentityApi> | null = null;

  async authenticate(clientId: string): Promise<Authentication> {
    // NUNCA el token ni el clientId: son secretos y no van a un registro.
    this.log.debug('pidiendo token al proveedor');
    const credential = await this.requestToken(clientId);
    if (!credential.allows(DRIVE_FILE_PERMISSION)) {
      this.log.debug('token concedido pero sin el permiso de Drive');
      throw new Error(
        'No has concedido el permiso para crear la hoja en tu Drive. Vuelve a conectar y acepta la casilla.',
      );
    }
    this.log.debug('token concedido con el permiso de Drive, leyendo el perfil');
    const account = await this.readProfile(credential);
    this.log.debug('perfil leído', { accountId: account.id.value });
    return { account, credential };
  }

  async revoke(credential: Credential): Promise<void> {
    const google = await this.load();
    await new Promise<void>((resolve) => google.accounts.oauth2.revoke(credential.token, resolve));
    this.log.debug('token revocado en el proveedor');
  }

  private async requestToken(clientId: string): Promise<Credential> {
    const google = await this.load();

    return new Promise<Credential>((resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(new Error(describe(response.error, response.error_description)));
            return;
          }
          resolve(
            Credential.of(
              response.access_token,
              Number(response.expires_in ?? 0),
              (response.scope ?? '').split(' ').filter((entry) => entry.length > 0),
              Date.now(),
            ),
          );
        },
        error_callback: (error) => reject(new Error(describe(error.type, error.message))),
      });

      client.requestAccessToken({ prompt: 'select_account' });
    });
  }

  /** El perfil sale del endpoint OIDC estándar; es la única llamada directa a Google de la app. */
  private async readProfile(credential: Credential): Promise<Account> {
    const response = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${credential.token}` },
    });
    if (!response.ok) {
      throw new Error('Google no ha devuelto el perfil de la cuenta. Vuelve a intentarlo.');
    }
    const profile = (await response.json()) as UserInfoResponse;
    if (!profile.sub || !profile.email) {
      throw new Error('Google no ha identificado la cuenta (falta el correo).');
    }
    return Account.of(profile.sub, profile.email, profile.name ?? '', profile.picture ?? null);
  }

  /**
   * Carga el script de GIS la primera vez que hace falta. Se inyecta en runtime, y no con una
   * etiqueta en `index.html`, para que quien nunca conecte su cuenta no descargue nada de Google.
   */
  private load(): Promise<GoogleIdentityApi> {
    const pending = this.loading ?? this.injectScript();
    this.loading = pending;
    return pending;
  }

  private injectScript(): Promise<GoogleIdentityApi> {
    return new Promise<GoogleIdentityApi>((resolve, reject) => {
      const existing = readApi();
      if (existing) {
        this.log.debug('el script de Google ya estaba cargado');
        resolve(existing);
        return;
      }

      this.log.debug('inyectando el script de Google', { url: GIS_SCRIPT_URL });
      const script = document.createElement('script');
      script.src = GIS_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const api = readApi();
        if (api) {
          this.log.debug('script de Google cargado');
          resolve(api);
        } else {
          reject(new Error('El script de Google se ha cargado pero no expone su API de OAuth.'));
        }
      };
      script.onerror = () =>
        reject(
          new Error(
            'No se ha podido cargar el script de Google (accounts.google.com). Revisa tu conexión o un bloqueador de contenido.',
          ),
        );
      document.head.appendChild(script);
    }).catch((error: unknown) => {
      // Un fallo de carga no se memoriza: el siguiente intento vuelve a probar. No se registra
      // como fallo —se relanza— pero sí queda constancia de que se olvidó el intento.
      this.log.debug('carga del script fallida, se olvida para poder reintentar');
      this.loading = null;
      throw error;
    });
  }
}

function readApi(): GoogleIdentityApi | null {
  const candidate = (window as unknown as { google?: GoogleIdentityApi }).google;
  return candidate?.accounts?.oauth2 ? candidate : null;
}

/** Traduce los errores de GIS a algo que el usuario pueda accionar. */
function describe(type: string | undefined, detail: string | undefined): string {
  switch (type) {
    case 'popup_closed':
    case 'popup_failed_to_open':
      return 'Se ha cerrado la ventana de Google (o la ha bloqueado el navegador). Vuelve a intentarlo y permite las ventanas emergentes de este sitio.';
    case 'access_denied':
      return 'Has denegado el permiso. Sin él la app no puede crear la hoja en tu Drive.';
    case 'idpiframe_initialization_failed':
      return 'Google no acepta este origen. Añade la URL de la app a «Orígenes de JavaScript autorizados» del Client ID (ver manual/appscript.md, paso 4).';
    default:
      return detail
        ? `Google ha rechazado la autorización: ${detail}`
        : 'Google ha rechazado la autorización. Comprueba el Client ID y sus orígenes autorizados (ver manual/appscript.md, paso 4).';
  }
}
