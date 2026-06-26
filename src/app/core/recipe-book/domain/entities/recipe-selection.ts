import { EntityId } from '../../../_common/entity-id';

interface RecipeSelectionData {
    id: EntityId;
    recipeId: EntityId;
    flavorLabel?: string;
    portionsOptionId?: EntityId;
    moldOptionId?: EntityId;
}

/**
 * Una SELECCIÓN de una receta en un tamaño concreto. Guarda la receta elegida y lo
 * elegido en cada dimensión visible: el sabor (por label), y las opciones de
 * porciones/molde **por id**.
 *
 * Punto clave (persistencia del tamaño): se guardan los `optionId` reales elegidos
 * (p. ej. la opción de factor 0.5), no el factor. El factor se lee vivo del catálogo
 * por esos ids; la receta base es siempre factor 1 y nunca se recalcula.
 */
export class RecipeSelection {
    readonly id: EntityId; // Nivel 1: identidad única de la selección
    readonly recipeId: EntityId; // Nivel 2: receta elegida (id de otra raíz del contexto)
    readonly flavorLabel?: string; // Nivel 1: sabor elegido (label; el sabor no escala)
    readonly portionsOptionId?: EntityId; // Nivel 2: opción de porciones elegida (id del catálogo)
    readonly moldOptionId?: EntityId; // Nivel 2: opción de molde elegida (id del catálogo)

    private constructor(data: RecipeSelectionData) {
        this.id = data.id;
        this.recipeId = data.recipeId;
        this.flavorLabel = data.flavorLabel;
        this.portionsOptionId = data.portionsOptionId;
        this.moldOptionId = data.moldOptionId;
    }

    static create(
        id: EntityId,
        recipeId: EntityId,
        selection: { flavorLabel?: string; portionsOptionId?: EntityId; moldOptionId?: EntityId },
    ): RecipeSelection {
        return new RecipeSelection({
            id,
            recipeId,
            flavorLabel: selection.flavorLabel?.trim() || undefined,
            portionsOptionId: selection.portionsOptionId,
            moldOptionId: selection.moldOptionId,
        });
    }

    equals(other: RecipeSelection): boolean {
        return this.id.equals(other.id);
    }
}
