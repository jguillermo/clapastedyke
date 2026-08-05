import { AggregateRoot } from '../../../_common/aggregate';
import { EntityId } from '../../../_common/entity-id';
import { RecipeBookEvents } from '../events/recipe-book-events';

interface RecipeCategoryData {
  id: EntityId;
  name: string;
  /** Ver `RecipeCategory.updatedAt`. Opcional: quien la arma de cero todavía no la ha guardado. */
  updatedAt?: string | null;
}

/**
 * Una CATEGORÍA del recetario (Queques, Rellenos, Coberturas…). Entidad de catálogo
 * simple: identidad + nombre visible. Aggregate root con su propio repositorio.
 *
 * Graba su propio evento: `create` deja un `RecipeCategorySaved` en la cola, que el caso de uso saca
 * con `pullEvents()` tras persistir. `restore` es la vía muda para rehidratar.
 */
export class RecipeCategory extends AggregateRoot {
  readonly id: EntityId; // Nivel 1: identidad única de la categoría
  readonly name: string; // Nivel 1: nombre visible (Queques, Galletas…)
  /** Nivel 3: metadato de auditoría — cuándo se guardó por última vez. Ver `Supply.updatedAt`. */
  readonly updatedAt: string | null;

  private constructor(data: RecipeCategoryData) {
    super();
    this.id = data.id;
    this.name = data.name;
    this.updatedAt = data.updatedAt ?? null;
  }

  /** Arma la categoría y graba que se guardó. */
  static create(id: EntityId, name: string): RecipeCategory {
    if (!name.trim()) {
      throw new Error('Category name is required');
    }
    const category = new RecipeCategory({ id, name: name.trim() });
    category.recordEvent(RecipeBookEvents.recipeCategorySaved(id.value, { name: category.name }));
    return category;
  }

  /** Rehidrata desde almacenamiento: NO graba eventos (leer no es guardar). */
  static restore(data: RecipeCategoryData): RecipeCategory {
    return new RecipeCategory(data);
  }

  equals(other: RecipeCategory): boolean {
    return this.id.equals(other.id);
  }
}
