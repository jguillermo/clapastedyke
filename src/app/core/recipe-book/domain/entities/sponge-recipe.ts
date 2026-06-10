import { EntityId } from '../../../_common/entity-id';
import { IngredientLine } from '../value-objects/ingredient-line';
import { RecipeYield } from '../value-objects/recipe-yield';

interface SpongeRecipeData {
    id: EntityId;
    name: string;
    flavor?: string;
    referenceYield: RecipeYield;
    lines: IngredientLine[];
}

/**
 * The sponge (queque): the cake's base. Defines the reference weight that
 * governs the scaling of the whole cake. Aggregate root; lines are added only
 * through the root.
 */
export class SpongeRecipe {
    readonly id: EntityId; // Nivel 1: identidad única de la receta
    readonly name: string; // Nivel 1: nombre de la receta (único, ver §11.2)
    readonly flavor?: string; // Nivel 1: sabor opcional
    readonly referenceYield: RecipeYield; // Nivel 1: rinde de referencia que gobierna el escalado
    readonly lines: readonly IngredientLine[]; // Nivel 3: líneas de ingrediente; solo se modifican vía la raíz

    private constructor(data: SpongeRecipeData) {
        this.id = data.id;
        this.name = data.name;
        this.flavor = data.flavor;
        this.referenceYield = data.referenceYield;
        this.lines = data.lines;
    }

    static create(
        id: EntityId,
        name: string,
        referenceYield: RecipeYield,
        lines: IngredientLine[],
        flavor?: string,
    ): SpongeRecipe {
        if (!name.trim()) {
            throw new Error('Sponge recipe name is required');
        }
        if (lines.length === 0) {
            throw new Error('Sponge recipe needs at least one ingredient line');
        }
        return new SpongeRecipe({ id, name: name.trim(), flavor: flavor?.trim() || undefined, referenceYield, lines });
    }

    addLine(line: IngredientLine): SpongeRecipe {
        return this.with({ lines: [...this.lines, line] });
    }

    changeYield(referenceYield: RecipeYield): SpongeRecipe {
        return this.with({ referenceYield });
    }

    equals(other: SpongeRecipe): boolean {
        return this.id.equals(other.id);
    }

    private with(changes: Partial<SpongeRecipeData>): SpongeRecipe {
        return new SpongeRecipe({
            id: this.id,
            name: this.name,
            flavor: this.flavor,
            referenceYield: this.referenceYield,
            lines: [...this.lines],
            ...changes,
        });
    }
}
