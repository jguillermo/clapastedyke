/** URL (relativa) del documento de configuración, servido desde `public/`. */
export const CONFIG_DOCUMENT_URL = 'config.json';

/**
 * Configuración de la integración con Google, resuelta al arrancar. Ambos valores pueden faltar:
 * la app funciona igual (local-only) y la pantalla de cuenta pide lo que haga falta.
 */
export interface IntegrationConfig {
  /** URL `/exec` del Web App de Apps Script que escribe en la hoja. */
  appsScriptUrl: string | null;
  /** Client ID de OAuth por defecto. Cada usuario puede poner el suyo en `/cuenta`. */
  googleClientId: string | null;
}

/**
 * Configuración de despliegue leída en runtime.
 *
 * Vive en **infraestructura** del shared kernel, y no en una capa de dominio, porque sus claves son
 * tecnología pura (a qué Apps Script se llama, con qué Client ID de Google). Solo la consumen
 * adaptadores: el repositorio de ajustes de `auth` y el gateway de `external-sync`. Ni un caso de uso
 * ni una entidad la importan.
 *
 * Es un fichero servido, no una constante compilada, para poder cambiar el despliegue sin recompilar
 * ni volver a publicar la app.
 */
export abstract class AppConfig {
  /** La carga el app-initializer antes de que renderice la app. Nunca lanza. */
  abstract load(): Promise<void>;
  abstract get integration(): IntegrationConfig;
}
