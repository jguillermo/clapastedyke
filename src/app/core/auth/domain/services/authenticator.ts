import { Account } from '../entities/account';
import { Credential } from '../value-objects/credential';

/** Lo que devuelve una autenticación correcta: quién es y con qué queda autorizado. */
export interface Authentication {
  account: Account;
  credential: Credential;
}

/**
 * Cómo acaba un intento de reanudar.
 *
 * Los tres casos se resuelven de forma distinta, y por eso son tres y no un `Authentication | null`:
 * con ese `null` «no se ha podido preguntar» y «la respuesta es que no» eran indistinguibles, así que
 * quedarse sin cobertura echaba al usuario igual que si le hubieran retirado el acceso.
 *
 * - `authenticated` — hay sesión y credencial nueva.
 * - `unreachable` — no se ha podido hablar con el proveedor. **No dice nada sobre la sesión**: sigue
 *   siendo válida hasta que alguien pueda preguntar.
 * - `invalid` — el proveedor ha contestado que esta sesión ya no vale. Es lo único que autoriza a
 *   olvidarla.
 */
export type ResumeOutcome =
  | { kind: 'authenticated'; authentication: Authentication }
  | { kind: 'unreachable' }
  | { kind: 'invalid' };

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
   * Adelanta lo que `authenticate` necesite tener listo, para que ese pueda ocurrir **dentro del
   * gesto del usuario**.
   *
   * Existe por una restricción del navegador, no por rendimiento: autenticar abre una ventana
   * emergente, y el navegador solo la permite si sale de un clic. Cualquier espera previa —descargar
   * el SDK del proveedor, típicamente— puede romper ese vínculo y hacer que la ventana se bloquee
   * justo la primera vez, que es la única que importa.
   *
   * No devuelve nada y no puede fallar hacia fuera: es un adelanto, y si no sale, `authenticate` hará
   * el trabajo por su cuenta. Llamarlo varias veces no lo repite.
   */
  abstract prepare(): void;

  /**
   * Autentica al usuario. Debe permitirle **elegir cuenta** en cada intento; si no, cambiar de
   * cuenta sería imposible.
   *
   * Hay que llamarlo **dentro del gesto del usuario**. Ver {@link prepare}.
   *
   * @param clientId identificador de la aplicación ante el proveedor.
   */
  abstract authenticate(clientId: string): Promise<Authentication>;

  /**
   * Vuelve a entrar **sin interrumpir al usuario**.
   *
   * Es lo que hace que recargar la página no eche a nadie. Nunca debe enseñar una ventana ni pedir
   * nada: si hiciera falta interacción, la respuesta es `invalid`.
   *
   * No recibe con qué cuenta se estaba: quién es lo pone la propia sesión que el proveedor custodia.
   */
  abstract resume(): Promise<ResumeOutcome>;

  /**
   * Termina la sesión de **este** navegador en el proveedor. Las demás sesiones de esa persona no se
   * enteran, y su autorización sigue en pie.
   *
   * Devuelve el resultado en vez de lanzar porque quien llama tiene que poder distinguirlos: sin
   * conexión no se puede dar por cerrada una sesión que quizá siga viva al otro lado.
   */
  abstract closeRemoteSession(): Promise<'closed' | 'unreachable'>;
}
