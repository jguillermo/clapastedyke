import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { IngredientLine } from '../value-objects/ingredient-line';
import { RecipePropertyValue } from '../value-objects/recipe-property-value';

interface RecipeData {
    id: EntityId;
    categoryId: EntityId;
    name: string;
    values: RecipePropertyValue[];
    lines: IngredientLine[];
}

/**
 * Una RECETA. Pertenece a una categoría (por id) y toma valores para las
 * propiedades del esquema de esa categoría. Siempre tiene título y al menos una
 * línea de ingrediente. La validación de "propiedades obligatorias/tipos" la
 * hace la categoría (la orquesta el use case, que carga ambas). Aggregate root;
 * las líneas se modifican solo a través de la raíz.
 */
export class Recipe {
    readonly id: EntityId; // Nivel 1: identidad única de la receta
    readonly categoryId: EntityId; // Nivel 2: categoría a la que pertenece (id de otra raíz del contexto)
    readonly name: string; // Nivel 1: título de la receta
    readonly values: readonly RecipePropertyValue[]; // Nivel 1: valores de las propiedades del esquema
    readonly lines: readonly IngredientLine[]; // Nivel 3: líneas de ingrediente; solo se modifican vía la raíz

    private constructor(data: RecipeData) {
        this.id = data.id;
        this.categoryId = data.categoryId;
        this.name = data.name;
        this.values = data.values;
        this.lines = data.lines;
    }

    static create(
        id: EntityId,
        categoryId: EntityId,
        name: string,
        values: RecipePropertyValue[],
        lines: IngredientLine[],
    ): Recipe {
        if (!name.trim()) {
            throw new Error('Recipe name is required');
        }
        if (lines.length === 0) {
            throw new Error('Recipe needs at least one ingredient line');
        }
        const ids = new Set(values.map((v) => v.propertyId));
        if (ids.size !== values.length) {
            throw new Error('Recipe property values must reference distinct properties');
        }
        return new Recipe({ id, categoryId, name: name.trim(), values: [...values], lines: [...lines] });
    }

    addLine(line: IngredientLine): Recipe {
        return this.with({ lines: [...this.lines, line] });
    }

    /** Valor de una propiedad por id (o `undefined` si no fue rellenada). */
    valueOf(propertyId: string): RecipePropertyValue | undefined {
        return this.values.find((v) => v.propertyId === propertyId);
    }

    /** Peso para el escalado del pastel: el valor de la propiedad `propertyId` como Quantity. */
    weightFor(propertyId: string): Quantity | undefined {
        return this.valueOf(propertyId)?.asWeight();
    }

    equals(other: Recipe): boolean {
        return this.id.equals(other.id);
    }

    private with(changes: Partial<RecipeData>): Recipe {
        return new Recipe({
            id: this.id,
            categoryId: this.categoryId,
            name: this.name,
            values: [...this.values],
            lines: [...this.lines],
            ...changes,
        });
    }
}
