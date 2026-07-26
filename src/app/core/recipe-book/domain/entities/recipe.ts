import { EntityId } from '../../../_common/entity-id';
import { SupplyLine } from '../value-objects/supply-line';

interface RecipeData {
    id: EntityId;
    categoryId: EntityId;
    name: string;
    lines: SupplyLine[];
}

/**
 * Una RECETA. Pertenece a una categoría (por id) y siempre tiene título y al menos
 * una línea de insumo. Aggregate root; las líneas se modifican solo a través de la
 * raíz.
 */
export class Recipe {
    readonly id: EntityId; // Nivel 1: identidad única de la receta
    readonly categoryId: EntityId; // Nivel 2: categoría a la que pertenece (id de otra raíz del contexto)
    readonly name: string; // Nivel 1: título de la receta
    readonly lines: readonly SupplyLine[]; // Nivel 3: líneas de insumo; solo se modifican vía la raíz

    private constructor(data: RecipeData) {
        this.id = data.id;
        this.categoryId = data.categoryId;
        this.name = data.name;
        this.lines = data.lines;
    }

    static create(
        id: EntityId,
        categoryId: EntityId,
        name: string,
        lines: SupplyLine[],
    ): Recipe {
        if (!name.trim()) {
            throw new Error('Recipe name is required');
        }
        if (lines.length === 0) {
            throw new Error('Recipe needs at least one supply line');
        }
        return new Recipe({ id, categoryId, name: name.trim(), lines: [...lines] });
    }

    addLine(line: SupplyLine): Recipe {
        return this.with({ lines: [...this.lines, line] });
    }

    equals(other: Recipe): boolean {
        return this.id.equals(other.id);
    }

    private with(changes: Partial<RecipeData>): Recipe {
        return new Recipe({
            id: this.id,
            categoryId: this.categoryId,
            name: this.name,
            lines: [...this.lines],
            ...changes,
        });
    }
}
