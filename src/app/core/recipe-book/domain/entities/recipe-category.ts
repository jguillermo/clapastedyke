import { EntityId } from '../../../_common/entity-id';

interface RecipeCategoryData {
  id: EntityId;
  name: string;
}

/**
 * Una CATEGORÍA del recetario (Queques, Rellenos, Coberturas…). Entidad de catálogo
 * simple: identidad + nombre visible. Aggregate root con su propio repositorio.
 */
export class RecipeCategory {
  readonly id: EntityId; // Nivel 1: identidad única de la categoría
  readonly name: string; // Nivel 1: nombre visible (Queques, Galletas…)

  private constructor(data: RecipeCategoryData) {
    this.id = data.id;
    this.name = data.name;
  }

  static create(id: EntityId, name: string): RecipeCategory {
    if (!name.trim()) {
      throw new Error('Category name is required');
    }
    return new RecipeCategory({ id, name: name.trim() });
  }

  equals(other: RecipeCategory): boolean {
    return this.id.equals(other.id);
  }
}
