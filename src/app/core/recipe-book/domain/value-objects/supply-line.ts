import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';

interface SupplyLineData {
    supplyId: EntityId;
    quantity: Quantity;
}

/**
 * Una línea de receta: un insumo (por id) y cuánto de él usa la receta, expresado
 * al peso de referencia de la receta. Identidad por valor. Compone un EntityId y
 * un Quantity; es parte de Recipe.
 */
export class SupplyLine {
    readonly supplyId: EntityId;
    readonly quantity: Quantity;

    private constructor(data: SupplyLineData) {
        this.supplyId = data.supplyId;
        this.quantity = data.quantity;
    }

    static of(supplyId: EntityId, quantity: Quantity): SupplyLine {
        // Quantity.of ya exige value > 0; la línea solo compone los dos VOs.
        return new SupplyLine({ supplyId, quantity });
    }

    equals(other: SupplyLine): boolean {
        return this.supplyId.equals(other.supplyId) && this.quantity.equals(other.quantity);
    }
}
