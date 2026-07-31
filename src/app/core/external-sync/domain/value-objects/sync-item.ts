/**
 * Un cambio pendiente de sincronizar: **qué agregado** cambió y **cuál**.
 *
 * `aggregate` es un nombre libre (`'recipe'`, `'supply'`, …) porque este contexto no conoce el
 * catálogo de agregados de nadie: los pone quien publica los cambios y los entiende el origen que
 * los proyecta. Así sincronizar algo nuevo no obliga a tocar el dominio.
 *
 * **No lleva los datos**: se leen del origen en el momento de enviar, así que la cola nunca puede
 * mandar una versión vieja de algo que se ha editado dos veces seguidas.
 */
export class SyncItem {
  private constructor(
    readonly aggregate: string,
    readonly id: string,
  ) {}

  static of(aggregate: string, id: string): SyncItem {
    if (!aggregate.trim()) {
      throw new Error('Un cambio a sincronizar necesita el nombre de su agregado.');
    }
    if (!id.trim()) {
      throw new Error('Un cambio a sincronizar necesita un id.');
    }
    return new SyncItem(aggregate.trim(), id.trim());
  }

  /** Clave de deduplicación: dos cambios del mismo dato colapsan en uno. */
  key(): string {
    return `${this.aggregate}:${this.id}`;
  }

  equals(other: SyncItem): boolean {
    return this.aggregate === other.aggregate && this.id === other.id;
  }

  toString(): string {
    return this.key();
  }
}
