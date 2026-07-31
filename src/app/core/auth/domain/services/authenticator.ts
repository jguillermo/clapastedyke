import { Account } from '../entities/account';
import { Credential } from '../value-objects/credential';

/** Lo que devuelve una autenticación correcta: quién es y con qué queda autorizado. */
export interface Authentication {
  account: Account;
  credential: Credential;
}

/**
 * Inicia y termina la sesión del usuario contra un proveedor de identidad.
 *
 * **Un solo puerto para todo el proceso.** Quién sea el proveedor, cómo se pida el consentimiento y
 * de dónde salga el perfil son detalles de la implementación: el dominio solo sabe que alguien
 * devuelve una cuenta y una credencial. La implementación concreta vive entera en
 * `infrastructure/`.
 *
 * Es un **servicio**, no un repositorio: coordina un flujo interactivo, no accede a un almacén.
 */
export abstract class Authenticator {
  /**
   * Autentica al usuario. Debe permitirle **elegir cuenta** en cada intento; si no, cambiar de
   * cuenta sería imposible.
   *
   * @param clientId identificador de la aplicación ante el proveedor.
   */
  abstract authenticate(clientId: string): Promise<Authentication>;

  /** Retira la autorización concedida. */
  abstract revoke(credential: Credential): Promise<void>;
}
