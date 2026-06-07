import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { IngredientLine } from '../value-objects/ingredient-line';

interface CoveringRecipeData {
    id: EntityId;
    name: string;
    referenceWeight: Quantity;
    lines: IngredientLine[];
}

/**
 * The covering (cobertura): a layer scaled by the cake weight. Quantities are
 * expressed for `referenceWeight` of cake. Aggregate root; lines are added
 * only through the root.
 */
export class CoveringRecipe {
    readonly id: EntityId; // Nivel 1: identidad única de la receta
    readonly name: string; // Nivel 1: nombre de la receta (único, ver §11.2)
    readonly referenceWeight: Quantity; // Nivel 1: peso de queque para el que rinden las cantidades (g)
    readonly lines: readonly IngredientLine[]; // Nivel 3: líneas de ingrediente; solo se modifican vía la raíz

    private constructor(data: CoveringRecipeData) {
        this.id = data.id;
        this.name = data.name;
        this.referenceWeight = data.referenceWeight;
        this.lines = data.lines;
    }

    static create(id: EntityId, name: string, referenceWeight: Quantity, lines: IngredientLine[]): CoveringRecipe {
        if (!name.trim()) {
            throw new Error('Covering recipe name is required');
        }
        if (lines.length === 0) {
            throw new Error('Covering recipe needs at least one ingredient line');
        }
        return new CoveringRecipe({ id, name: name.trim(), referenceWeight, lines });
    }

    addLine(line: IngredientLine): CoveringRecipe {
        return new CoveringRecipe({
            id: this.id,
            name: this.name,
            referenceWeight: this.referenceWeight,
            lines: [...this.lines, line],
        });
    }

    equals(other: CoveringRecipe): boolean {
        return this.id.equals(other.id);
    }
}
