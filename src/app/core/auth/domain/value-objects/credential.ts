/** Margen antes de la caducidad real: una credencial a punto de expirar no se usa. */
const EXPIRY_MARGIN_MS = 60_000;

/**
 * La credencial con la que se autoriza cada operación en nombre del usuario.
 *
 * **Nunca se persiste**: vive solo en memoria mientras dura la sesión. Así, cerrar sesión o recargar
 * la página la hace desaparecer sin que haya que acordarse de borrar nada.
 *
 * Value object: identidad por valor, inmutable y con comportamiento sin efectos de lado.
 */
export class Credential {
  private constructor(
    readonly token: string,
    readonly expiresAt: number,
    readonly grants: readonly string[],
  ) {}

  /**
   * @param lifetimeSeconds validez que declara el proveedor.
   * @param grants permisos concedidos (lo que el proveedor llama «scopes»).
   * @param now instante de referencia en ms; se pasa explícitamente para poder testarlo.
   */
  static of(
    token: string,
    lifetimeSeconds: number,
    grants: readonly string[],
    now: number,
  ): Credential {
    if (!token.trim()) {
      throw new Error('El proveedor de identidad no ha devuelto una credencial.');
    }
    const lifetime = Number.isFinite(lifetimeSeconds) && lifetimeSeconds > 0 ? lifetimeSeconds : 0;
    return new Credential(token, now + lifetime * 1000, [...grants]);
  }

  isExpired(now: number): boolean {
    return now + EXPIRY_MARGIN_MS >= this.expiresAt;
  }

  allows(permission: string): boolean {
    return this.grants.includes(permission);
  }

  equals(other: Credential): boolean {
    return this.token === other.token && this.expiresAt === other.expiresAt;
  }

  /** Enmascarada a propósito: una credencial no debe acabar en un log ni en un mensaje de error. */
  toString(): string {
    return `Credential(…${this.token.slice(-6)})`;
  }
}
