import { inject, Injectable } from '@angular/core';
import { Logger } from '@core/_common/logger/logger';

/**
 * El **modelo de código** de Google Identity Services: pide al usuario que autorice y devuelve un
 * código de un solo uso.
 *
 * Este es el ÚNICO fichero del navegador que sabe que el proveedor es Google. El código que emite
 * no sirve para nada por sí mismo: solo el backend, que tiene el *client secret*, puede canjearlo.
 *
 * ## Por qué el modelo de código y no el de token
 *
 * El modelo de token entrega un token de acceso directamente al navegador y **no da refresh
 * token**: caduca en una hora y solo se puede renovar volviendo a abrir una ventana emergente. Como
 * `requestAccessToken()` exige un gesto del usuario para que el navegador no bloquee esa ventana,
 * reanudar la sesión al arrancar la página era imposible — que es exactamente el fallo que este
 * cambio arregla.
 *
 * El modelo de código pide autorización **una sola vez**, en el clic de «Conectar». A partir de ahí
 * quien renueva es el backend, sin ventanas y sin gestos.
 */

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

/** Permiso sin el cual no se puede crear ni escribir la hoja de cálculo del usuario. */
export const DRIVE_FILE_PERMISSION = 'https://www.googleapis.com/auth/drive.file';

/**
 * **Una sola casilla, y la más estrecha que existe.** `drive.file` alcanza únicamente los ficheros
 * que esta app crea: la hoja del recetario entra, y el resto del Drive del usuario no se ve
 * siquiera. Google no lo considera sensible, así que no hay verificación ni techo de usuarios.
 */
export const SCOPES = ['openid', 'email', 'profile', DRIVE_FILE_PERMISSION].join(' ');

// Tipado mínimo de GIS, escrito a mano: `tsconfig.app.json` declara `"types": []` (sin tipos
// ambientales) y de toda la librería aquí solo se usa el modelo de código.
interface CodeResponse {
  code?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GoogleIdentityApi {
  accounts: {
    oauth2: {
      initCodeClient(config: {
        client_id: string;
        scope: string;
        ux_mode: 'popup';
        select_account?: boolean;
        callback: (response: CodeResponse) => void;
        error_callback?: (error: { type?: string; message?: string }) => void;
      }): { requestCode(): void };
    };
  };
}

@Injectable({ providedIn: 'root' })
export class GoogleCodeClient {
  private readonly log = inject(Logger).scoped('auth/google');

  private loading: Promise<GoogleIdentityApi> | null = null;

  /**
   * Abre la ventana de Google y devuelve el código de autorización.
   *
   * **Hay que llamarlo dentro del gesto del usuario** (el clic en «Conectar»): abre una ventana
   * emergente y el navegador la bloquearía si no. Es la única operación de toda la sesión con esa
   * restricción, y por eso es la única que ocurre en respuesta a un clic.
   *
   * `select_account: true` garantiza que el usuario pueda **elegir cuenta** —y por tanto cambiar de
   * cuenta—; con el comportamiento por defecto Google reutilizaría la última en silencio.
   */
  async requestCode(clientId: string): Promise<string> {
    const google = await this.load();
    this.log.debug('pidiendo autorización al proveedor');

    return new Promise<string>((resolve, reject) => {
      const client = google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: SCOPES,
        ux_mode: 'popup',
        select_account: true,
        callback: (response) => {
          if (response.error || !response.code) {
            reject(new Error(describe(response.error, response.error_description)));
            return;
          }
          this.log.debug('autorización concedida');
          resolve(response.code);
        },
        error_callback: (error) => reject(new Error(describe(error.type, error.message))),
      });

      client.requestCode();
    });
  }

  /**
   * Carga el script de GIS la primera vez que hace falta. Se inyecta en runtime, y no con una
   * etiqueta en `index.html`, para que quien nunca conecte su cuenta no descargue nada de Google.
   *
   * Con el modelo de código esto solo ocurre al pulsar «Conectar»: **reanudar una sesión ya no toca
   * a Google desde el navegador**, así que una recarga no descarga este script.
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
      return 'Google no acepta este origen. Añade la URL de la app a «Orígenes de JavaScript autorizados» del Client ID (ver manual/google-integration.md).';
    default:
      return detail
        ? `Google ha rechazado la autorización: ${detail}`
        : 'Google ha rechazado la autorización. Comprueba el Client ID y sus orígenes autorizados (ver manual/google-integration.md).';
  }
}
