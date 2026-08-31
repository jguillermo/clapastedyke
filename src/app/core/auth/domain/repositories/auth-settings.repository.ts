/**
 * Ajustes de autenticación de la app. Repositorio puro: leer, y nada más.
 *
 * Guarda **solo configuración** — el identificador de la aplicación ante el proveedor. Nunca
 * credenciales, nunca identidad: eso es sesión y vive en memoria.
 *
 * **Es de solo lectura a propósito.** El identificador es de la *aplicación*, no del usuario: hay uno
 * para todo el despliegue y lo fija quien despliega. Hubo una época en que cada navegador podía
 * guardar el suyo desde la pantalla de cuenta, y solo servía para que dos personas con la misma app
 * tuvieran configuraciones distintas sin saberlo.
 */
export abstract class AuthSettingsRepository {
  /**
   * El identificador de cliente con el que iniciar sesión, o `null` si el despliegue no trae
   * ninguno y todavía no se puede autenticar a nadie.
   */
  abstract clientId(): Promise<string | null>;

  /**
   * La dirección base del servicio de sesión, o `null` si el despliegue no trae ninguna.
   *
   * Es del despliegue por la misma razón que `clientId`: la URL de la función lleva dentro el
   * proyecto y la región, así que cambia de un ambiente a otro y no puede vivir en el código.
   */
  abstract authApiUrl(): Promise<string | null>;
}
