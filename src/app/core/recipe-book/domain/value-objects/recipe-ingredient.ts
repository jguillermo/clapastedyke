import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';

interface RecipeIngredientData {
  supplyId: EntityId;
  quantity: Quantity;
}

/**
 * Un INGREDIENTE de una receta: qué insumo lleva (por id) y cuánto, expresado al peso de referencia
 * de la receta. Identidad por valor. Compone un EntityId y un Quantity; es parte de Recipe.
 */
export class RecipeIngredient {
  readonly supplyId: EntityId;
  readonly quantity: Quantity;

  private constructor(data: RecipeIngredientData) {
    this.supplyId = data.supplyId;
    this.quantity = data.quantity;
  }

  static of(supplyId: EntityId, quantity: Quantity): RecipeIngredient {
    // Quantity.of ya exige value > 0; el ingrediente solo compone los dos VOs.
    return new RecipeIngredient({ supplyId, quantity });
  }

  equals(other: RecipeIngredient): boolean {
    return this.supplyId.equals(other.supplyId) && this.quantity.equals(other.quantity);
  }
}
