/**
 * La pista mínima para poder **reanudar** una sesión sin volver a molestar al usuario.
 *
 * Deliberadamente **no es la credencial**. Un token guardado en disco es un token que cualquier XSS
 * puede leer mientras dure, y además caducaría en una hora igual — no compraría nada. Lo que se
 * guarda es solo con qué cuenta estaba, que es lo que el proveedor necesita para volver a emitir un
 * token en silencio si el usuario sigue con su sesión de Google abierta y el consentimiento dado.
 */
export interface SessionHint {
  /** Identidad estable de la cuenta con la que se estaba. */
  accountId: string;
  /**
   * Con qué correo pedir la reanudación. El proveedor lo necesita para no dudar entre las cuentas
   * que la persona tenga abiertas; **es un dato personal, y por eso está aquí y no en un registro**.
   */
  email: string;
}

/**
 * Recuerda con qué cuenta se estaba, para poder volver a entrar sin preguntar. Repositorio puro.
 *
 * Es lo único que este contexto persiste, y la razón es concreta: sin ello, **recargar la página
 * echa al usuario**. Guardar la pista no le da acceso a nadie — sin la sesión de Google del propio
 * navegador, no sirve de nada.
 */
export abstract class SessionHintRepository {
  abstract read(): Promise<SessionHint | null>;

  abstract save(hint: SessionHint): Promise<void>;

  /** Al cerrar sesión: si no se borra, la próxima carga volvería a entrar sola. */
  abstract clear(): Promise<void>;
}
