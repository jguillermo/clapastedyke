/**
 * Dónde ha quedado guardada la copia del recetario, tal como lo informa el destino.
 *
 * Deliberadamente **no dice qué es**: hoy es una hoja de cálculo, mañana podría ser un fichero, un
 * repositorio o una base de datos. Al dominio solo le importa que tenga una identidad estable y una
 * dirección que el usuario pueda abrir.
 *
 * La app no lo elige ni lo recuerda entre sesiones: lo decide el destino, y aquí solo se guarda para
 * poder ofrecer el enlace mientras dura la sesión.
 */
export class SyncTarget {
  private constructor(
    readonly id: string,
    readonly url: string,
  ) {}

  static of(id: string, url: string): SyncTarget {
    if (!id.trim()) {
      throw new Error('El destino no ha dicho dónde ha guardado la copia.');
    }
    return new SyncTarget(id.trim(), url.trim());
  }

  equals(other: SyncTarget): boolean {
    return this.id === other.id;
  }

  toString(): string {
    return this.url || this.id;
  }
}
