/** URL (relativa) del documento de configuración, servido desde `public/`. */
export const CONFIG_DOCUMENT_URL = 'config.json';

/**
 * Forma de `public/config.json`. **Todo opcional**: el fichero puede estar incompleto, ser de una
 * versión anterior o no existir, y la app tiene que arrancar igual.
 *
 * Es un **contrato de infraestructura**, no un modelo: lo escribe a mano quien despliega.
 */
export interface ConfigDocument {
  /** ¿Se ve el nivel `debug` en la consola? Ausente = `false`. */
  debug?: boolean;
  /** URL `/exec` del Web App de Apps Script que escribe en la hoja. */
  appsScriptUrl?: string;
  /** Client ID de OAuth de la app ante Google. */
  googleClientId?: string;
}

/**
 * Configuración de la integración con Google, resuelta al arrancar. Ambos valores pueden faltar:
 * la app funciona igual (local-only) y la pantalla de cuenta pide lo que haga falta.
 */
export interface IntegrationConfig {
  /** URL `/exec` del Web App de Apps Script que escribe en la hoja. */
  appsScriptUrl: string | null;
  /** Client ID de OAuth de la app. Uno para todo el despliegue: no se configura por usuario. */
  googleClientId: string | null;
}

/**
 * Configuración de despliegue leída en runtime. **Es la única que hay.**
 *
 * **El build es uno solo.** No hay `src/environments/` ni `fileReplacements` en `angular.json`:
 * compilar dos veces la misma app para cambiarle un booleano obliga a republicar por cada ajuste y
 * hace que lo que corre en producción no sea, literalmente, el artefacto que se probó. Aquí se
 * compila una vez y lo que cambia de un despliegue a otro es **este fichero**, que va servido al
 * lado del bundle y se edita sin recompilar nada.
 *
 * Vive en **infraestructura** del shared kernel, y no en una capa de dominio, porque sus claves son
 * tecnología pura (si se registra el detalle, a qué Apps Script se llama, con qué Client ID de
 * Google). Solo la consumen adaptadores: el repositorio de ajustes de `auth`, el gateway de
 * `external-sync` y el adaptador del `Logger`. Ni un caso de uso ni una entidad la importan.
 *
 * **Se lee antes de arrancar** (`main.ts`), no en un app-initializer: así todo lo que se inyecta
 * después la encuentra ya resuelta, y ninguna traza del arranque se pierde por ocurrir antes de que
 * la configuración estuviera disponible.
 */
export abstract class AppConfig {
  /** ¿Se emite `debug`? Lo consume el adaptador del `Logger`, nadie más. */
  abstract get debug(): boolean;
  abstract get integration(): IntegrationConfig;
}
