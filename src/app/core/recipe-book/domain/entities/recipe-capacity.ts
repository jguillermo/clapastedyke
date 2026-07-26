import { EntityId } from '../../../_common/entity-id';

/**
 * Grupos del catálogo de capacidad. Las dos dimensiones que escalan una receta:
 * `portions` (por porciones) y `mold` (por molde). Cada una se elige con su factor.
 */
export type CapacityGroup = 'portions' | 'mold';

export const CAPACITY_GROUPS: readonly CapacityGroup[] = ['portions', 'mold'];

interface RecipeCapacityData {
    id: EntityId;
    group: CapacityGroup;
    label: string;
    factor: number;
}

/**
 * Una CAPACIDAD de receta del catálogo: pertenece a un grupo (porciones/molde),
 * tiene un label visible y un `factor` que escala los valores base de la receta
 * (1 = base, 0.5 = mitad, 2 = doble). El factor es el dato que dispara los cálculos.
 * Aggregate root con su propio repositorio.
 */
export class RecipeCapacity {
    readonly id: EntityId; // Nivel 1: identidad única de la capacidad
    readonly group: CapacityGroup; // Nivel 1: grupo/dimensión (portions/mold)
    readonly label: string; // Nivel 1: nombre visible (Doble, Molde grande, 20 porciones…)
    readonly factor: number; // Nivel 1: factor de escalado sobre los valores base

    private constructor(data: RecipeCapacityData) {
        this.id = data.id;
        this.group = data.group;
        this.label = data.label;
        this.factor = data.factor;
    }

    static create(id: EntityId, group: CapacityGroup, label: string, factor: number): RecipeCapacity {
        if (!label.trim()) {
            throw new Error('Recipe capacity label is required');
        }
        if (!CAPACITY_GROUPS.includes(group)) {
            throw new Error(`Unknown capacity group "${group}"`);
        }
        if (!Number.isFinite(factor) || factor <= 0) {
            throw new Error('Capacity factor must be a positive number');
        }
        return new RecipeCapacity({ id, group, label: label.trim(), factor });
    }

    equals(other: RecipeCapacity): boolean {
        return this.id.equals(other.id);
    }
}
