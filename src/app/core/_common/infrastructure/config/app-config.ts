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
  /** Client ID de OAuth de la app ante Google. */
  googleClientId?: string;
  /**
   * URL base del servicio de sesión (la función `auth` de `firebase/functions`), sin barra final.
   * Cambia por proyecto y por región, así que no puede estar en el bundle.
   */
  authApiUrl?: string;
  /** Cada cuántos segundos se comprueba si hay cambios remotos. Ausente o inválido = 120 (2 min). */
  syncPollSeconds?: number;
}

/**
 * Configuración de la integración con Google, resuelta al arrancar.
 *
 * **Dos valores, y los dos son del despliegue entero**: con qué identidad se presenta la app ante
 * Google, y dónde vive el servicio que custodia el permiso duradero. Todo lo demás —dónde está la
 * hoja de cada persona, con qué token se escribe— es de cada usuario, se crea al conectar y vive en
 * su IndexedDB, no aquí.
 *
 * Cualquiera de los dos en `null` **apaga la integración**, y eso es un estado normal: la app sigue
 * siendo utilizable entera porque el recetario vive en IndexedDB.
 */
export interface IntegrationConfig {
  /** Client ID de OAuth de la app. Uno para todo el despliegue: no se configura por usuario. */
  googleClientId: string | null;
  /**
   * URL base del servicio de sesión, sin barra final. La app le cuelga `/exchange`, `/refresh` y
   * `/logout`.
   *
   * Es una URL **absoluta** porque la función no se sirve desde el mismo origen que la app: se llama
   * directamente, con CORS. Por eso no puede ser una ruta relativa fija en el código — la URL de una
   * Cloud Function lleva dentro el proyecto y la región.
   */
  authApiUrl: string | null;
}

/**
 * Cadencia del motor de sincronización, resuelta al arrancar.
 *
 * **Un solo valor**: cada cuánto se comprueba el destino por si otro dispositivo escribió. Es de
 * despliegue, no de usuario, por la misma razón que `IntegrationConfig`: cambiarlo no debería
 * exigir recompilar.
 */
export interface SyncConfig {
  /** Segundos entre dos comprobaciones del destino. */
  pollSeconds: number;
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
 * tecnología pura (si se registra el detalle, con qué Client ID de Google se identifica la app). Solo
 * la consumen adaptadores: el repositorio de ajustes de `auth`, el `SyncScheduler` de `external-sync`
 * y el adaptador del `Logger`. Ni un caso de uso ni una entidad la importan.
 *
 * **Se lee antes de arrancar** (`main.ts`), no en un app-initializer: así todo lo que se inyecta
 * después la encuentra ya resuelta, y ninguna traza del arranque se pierde por ocurrir antes de que
 * la configuración estuviera disponible.
 */
export abstract class AppConfig {
  /** ¿Se emite `debug`? Lo consume el adaptador del `Logger`, nadie más. */
  abstract get debug(): boolean;
  abstract get integration(): IntegrationConfig;
  abstract get sync(): SyncConfig;
}
