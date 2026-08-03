import { AggregateRoot } from '../../../_common/aggregate';
import { EntityId } from '../../../_common/entity-id';
import { RecipeBookEvents } from '../events/recipe-book-events';

interface RecipeFlavorData {
  id: EntityId;
  label: string;
}

/**
 * Un SABOR del catálogo (Vainilla, Chocolate…). Entidad simple: identidad + label
 * visible. No escala (no lleva factor): es identidad de la receta, no una opción
 * de conversión. Aggregate root con su propio repositorio.
 *
 * Graba su propio evento: `create` deja un `FlavorSaved` en la cola, que el caso de uso saca con
 * `pullEvents()` tras persistir. Renombrar no es un verbo aparte: se arma el sabor con el label
 * nuevo sobre la misma identidad y se persiste. `restore` es la vía muda para rehidratar.
 */
export class RecipeFlavor extends AggregateRoot {
  readonly id: EntityId; // Nivel 1: identidad única del sabor
  readonly label: string; // Nivel 1: nombre visible (Vainilla, Chocolate…)

  private constructor(data: RecipeFlavorData) {
    super();
    this.id = data.id;
    this.label = data.label;
  }

  /** Arma el sabor y graba que se guardó. */
  static create(id: EntityId, label: string): RecipeFlavor {
    if (!label.trim()) {
      throw new Error('Flavor label is required');
    }
    const flavor = new RecipeFlavor({ id, label: label.trim() });
    flavor.recordEvent(RecipeBookEvents.flavorSaved(id.value, { label: flavor.label }));
    return flavor;
  }

  /** Rehidrata desde almacenamiento: NO graba eventos (leer no es guardar). */
  static restore(data: RecipeFlavorData): RecipeFlavor {
    return new RecipeFlavor(data);
  }

  equals(other: RecipeFlavor): boolean {
    return this.id.equals(other.id);
  }
}
