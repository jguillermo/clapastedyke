import { BaseUnit } from '../../../_common/quantity';
import { EntityId } from '../../../_common/entity-id';

interface IngredientData {
    id: EntityId;
    name: string;
    baseUnit: BaseUnit;
}

/**
 * Raw material referenced by recipes. Needs identity because the ShoppingList
 * aggregates by ingredientId. Aggregate root.
 */
export class Ingredient {
    readonly id: EntityId; // Nivel 1: identidad única del insumo
    readonly name: string; // Nivel 1: nombre del insumo (único, ver §11.2)
    readonly baseUnit: BaseUnit; // Nivel 1: unidad en la que se mide (g | u)

    private constructor(data: IngredientData) {
        this.id = data.id;
        this.name = data.name;
        this.baseUnit = data.baseUnit;
    }

    static create(id: EntityId, name: string, baseUnit: BaseUnit): Ingredient {
        if (!name.trim()) {
            throw new Error('Ingredient name is required');
        }
        return new Ingredient({ id, name: name.trim(), baseUnit });
    }

    equals(other: Ingredient): boolean {
        return this.id.equals(other.id);
    }
}
