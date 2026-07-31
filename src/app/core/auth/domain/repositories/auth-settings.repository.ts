/**
 * Ajustes de autenticación de este navegador. Repositorio puro: leer y escribir, sin lógica.
 *
 * Guarda **solo configuración** — el identificador de la aplicación ante el proveedor. Nunca
 * credenciales, nunca identidad: eso es sesión y vive en memoria.
 */
export abstract class AuthSettingsRepository {
  /**
   * El `clientId` **efectivo**: el que el usuario guardó aquí o, si no hay ninguno, el que traiga la
   * configuración del despliegue. `null` cuando no hay ni uno ni otro y todavía no se puede
   * iniciar sesión.
   */
  abstract clientId(): Promise<string | null>;

  /** Guarda el `clientId` de este navegador. `null` vuelve a dejar mandar al del despliegue. */
  abstract saveClientId(clientId: string | null): Promise<void>;
}
