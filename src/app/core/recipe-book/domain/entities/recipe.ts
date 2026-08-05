import { AggregateRoot } from '../../../_common/aggregate';
import { EntityId } from '../../../_common/entity-id';
import { RecipeIngredient } from '../value-objects/recipe-ingredient';
import { RecipeBookEvents, RecipeSavedData } from '../events/recipe-book-events';

interface RecipeData {
  id: EntityId;
  categoryId: EntityId;
  name: string;
  ingredients: RecipeIngredient[];
  flavorId: EntityId | null;
  portionsCapacityId: EntityId | null;
  moldCapacityId: EntityId | null;
  /** Ver `Recipe.updatedAt`. Opcional: quien la arma de cero todavía no la ha guardado. */
  updatedAt?: string | null;
}

/**
 * Una RECETA. Pertenece a una categoría (por id) y siempre tiene título y al menos
 * un ingrediente. Puede tener un sabor y, independientemente, una capacidad por
 * porciones y/o una por molde (ambas opcionales y coexisten — son dos dimensiones
 * de tamaño distintas, no una sola elección). Aggregate root; los ingredientes se
 * cambian solo a través de la raíz.
 *
 * Graba su propio evento: `create` deja un `RecipeSaved` en la cola, que el caso de uso saca con
 * `pullEvents()` después de persistir. No hay verbos de alta y de edición por separado porque no hay
 * dos hechos: guardar una receta es armarla y persistirla, exista ya o no.
 */
export class Recipe extends AggregateRoot {
  readonly id: EntityId; // Nivel 1: identidad única de la receta
  readonly categoryId: EntityId; // Nivel 2: categoría a la que pertenece (id de otra raíz del contexto)
  readonly name: string; // Nivel 1: título de la receta
  readonly ingredients: readonly RecipeIngredient[]; // Nivel 3: qué lleva la receta y cuánto (insumo + cantidad); solo se cambian vía la raíz
  readonly flavorId: EntityId | null; // Nivel 2: sabor de la receta (id de otra raíz del contexto), opcional
  readonly portionsCapacityId: EntityId | null; // Nivel 2: capacidad por porciones (id de otra raíz del contexto), opcional
  readonly moldCapacityId: EntityId | null; // Nivel 2: capacidad por molde (id de otra raíz del contexto), opcional
  /** Nivel 3: metadato de auditoría — cuándo se guardó por última vez. Ver `Supply.updatedAt`. */
  readonly updatedAt: string | null;

  private constructor(data: RecipeData) {
    super();
    this.id = data.id;
    this.categoryId = data.categoryId;
    this.name = data.name;
    this.ingredients = data.ingredients;
    this.flavorId = data.flavorId;
    this.portionsCapacityId = data.portionsCapacityId;
    this.moldCapacityId = data.moldCapacityId;
    this.updatedAt = data.updatedAt ?? null;
  }

  /** Arma la receta a partir de sus value objects y graba que se guardó. */
  static create(
    id: EntityId,
    categoryId: EntityId,
    name: string,
    ingredients: RecipeIngredient[],
    flavorId: EntityId | null = null,
    portionsCapacityId: EntityId | null = null,
    moldCapacityId: EntityId | null = null,
  ): Recipe {
    if (!name.trim()) {
      throw new Error('Recipe name is required');
    }
    if (ingredients.length === 0) {
      throw new Error('Recipe needs at least one ingredient');
    }
    const recipe = new Recipe({
      id,
      categoryId,
      name: name.trim(),
      ingredients: [...ingredients],
      flavorId,
      portionsCapacityId,
      moldCapacityId,
    });
    recipe.recordEvent(RecipeBookEvents.recipeSaved(id.value, recipe.snapshot()));
    return recipe;
  }

  /** Rehidrata desde almacenamiento: NO graba eventos (leer no es guardar). */
  static restore(data: RecipeData): Recipe {
    return new Recipe(data);
  }

  equals(other: Recipe): boolean {
    return this.id.equals(other.id);
  }

  /**
   * El estado completo de la receta aplanado a primitivos: lo que viaja en `RecipeSaved`. El id no
   * va dentro — es el `aggregateId` del evento.
   */
  private snapshot(): RecipeSavedData {
    return {
      categoryId: this.categoryId.value,
      name: this.name,
      ingredients: this.ingredients.map((ingredient) => ({
        supplyId: ingredient.supplyId.value,
        quantity: ingredient.quantity.value,
        unit: ingredient.quantity.unit,
      })),
      flavorId: this.flavorId?.value ?? null,
      portionsCapacityId: this.portionsCapacityId?.value ?? null,
      moldCapacityId: this.moldCapacityId?.value ?? null,
    };
  }
}
