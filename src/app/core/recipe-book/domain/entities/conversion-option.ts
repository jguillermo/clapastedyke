import { EntityId } from '../../../_common/entity-id';

/**
 * Grupos del catálogo de conversión. Las dos dimensiones que escalan una receta:
 * `portions` (por porciones) y `mold` (por molde). Cada una se elige con su factor.
 */
export type ConversionGroup = 'portions' | 'mold';

export const CONVERSION_GROUPS: readonly ConversionGroup[] = ['portions', 'mold'];

interface ConversionOptionData {
    id: EntityId;
    group: ConversionGroup;
    label: string;
    factor: number;
}

/**
 * Una OPCIÓN de conversión del catálogo: pertenece a un grupo (tamaño/molde/porciones),
 * tiene un label visible y un `factor` que escala los valores base de la receta
 * (1 = base, 0.5 = mitad, 2 = doble). El factor es el dato que dispara los cálculos.
 * Aggregate root con su propio repositorio.
 */
export class ConversionOption {
    readonly id: EntityId; // Nivel 1: identidad única de la opción
    readonly group: ConversionGroup; // Nivel 1: grupo/dimensión (size/mold/portions)
    readonly label: string; // Nivel 1: nombre visible (Doble, Molde grande, 20 porciones…)
    readonly factor: number; // Nivel 1: factor de conversión sobre los valores base

    private constructor(data: ConversionOptionData) {
        this.id = data.id;
        this.group = data.group;
        this.label = data.label;
        this.factor = data.factor;
    }

    static create(id: EntityId, group: ConversionGroup, label: string, factor: number): ConversionOption {
        if (!label.trim()) {
            throw new Error('Conversion option label is required');
        }
        if (!CONVERSION_GROUPS.includes(group)) {
            throw new Error(`Unknown conversion group "${group}"`);
        }
        if (!Number.isFinite(factor) || factor <= 0) {
            throw new Error('Conversion factor must be a positive number');
        }
        return new ConversionOption({ id, group, label: label.trim(), factor });
    }

    equals(other: ConversionOption): boolean {
        return this.id.equals(other.id);
    }
}
