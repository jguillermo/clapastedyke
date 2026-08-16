/** Con qué actúa la app en nombre del usuario ante un sistema externo. Solo primitivos. */
export interface UserCredentials {
  /** La credencial en sí. Nunca se registra ni se guarda. */
  token: string;
  /**
   * Número de sesión con el que se emitió. Cambia con cada inicio y cada cierre, y sirve para
   * descartar el resultado de una operación cuya sesión ya no es la actual.
   */
  epoch: number;
  /**
   * Identidad **estable** de la cuenta, la que da el proveedor. Es la clave con la que otro contexto
   * puede recordar algo por cuenta —dónde quedó instalado su sincronizador, por ejemplo— sin usar el
   * correo, que la persona puede cambiar sin dejar de ser la misma.
   */
  accountId: string;
  /** Con qué cuenta se está actuando, para poder mostrarlo. */
  accountEmail: string;
}

/**
 * Contrato del shared kernel: **quién sabe entregar las credenciales de la sesión activa**.
 *
 * Vive aquí, y no en el contexto que autentica, porque un contexto no puede importar de otro. El que
 * gestiona la sesión lo implementa; el que necesita actuar en nombre del usuario lo consume. Ninguno
 * de los dos conoce al otro.
 *
 * Devolver `null` en vez de lanzar es deliberado: «no hay sesión» es un estado normal de la app, no
 * un error.
 */
export abstract class CredentialsProvider {
  abstract current(): Promise<UserCredentials | null>;
}
