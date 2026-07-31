import { EntityId } from '@core/_common/entity-id';

interface AccountData {
  id: EntityId;
  email: string;
  name: string;
  pictureUrl: string | null;
}

/**
 * La cuenta con la que el usuario ha iniciado sesión.
 *
 * Su identidad es el id **estable** que emite el proveedor de identidad, nunca el correo (que puede
 * cambiar). Entidad de solo lectura: la app reconoce cuentas, no las modifica.
 */
export class Account {
  readonly id: EntityId; // Nivel 1: identidad única en el proveedor
  readonly email: string; // Nivel 1: correo, para que el usuario sepa con quién está
  readonly name: string; // Nivel 1: nombre para mostrar (puede venir vacío)
  readonly pictureUrl: string | null; // Nivel 3: avatar, decorativo

  private constructor(data: AccountData) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.pictureUrl = data.pictureUrl;
  }

  static of(id: string, email: string, name = '', pictureUrl: string | null = null): Account {
    if (!email.trim()) {
      throw new Error('El proveedor de identidad no ha devuelto un correo.');
    }
    return new Account({
      id: new EntityId(id),
      email: email.trim(),
      name: name.trim(),
      pictureUrl,
    });
  }

  /** Lo que se muestra: el nombre si lo hay, el correo si no. */
  get displayName(): string {
    return this.name || this.email;
  }

  equals(other: Account): boolean {
    return this.id.equals(other.id);
  }
}
