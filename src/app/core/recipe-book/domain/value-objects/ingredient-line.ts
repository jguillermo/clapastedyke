import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';

interface IngredientLineData {
    ingredientId: EntityId;
    quantity: Quantity;
}

/**
 * A recipe line: an ingredient and how much of it the recipe uses, expressed
 * at the recipe's reference weight. Identity by value.
 */
export class IngredientLine {
    readonly ingredientId: EntityId;
    readonly quantity: Quantity;

    private constructor(data: IngredientLineData) {
        this.ingredientId = data.ingredientId;
        this.quantity = data.quantity;
    }

    static of(ingredientId: EntityId, quantity: Quantity): IngredientLine {
        // Quantity.of already enforces value > 0; the line just composes the two VOs.
        return new IngredientLine({ ingredientId, quantity });
    }

    equals(other: IngredientLine): boolean {
        return this.ingredientId.equals(other.ingredientId) && this.quantity.equals(other.quantity);
    }
}
