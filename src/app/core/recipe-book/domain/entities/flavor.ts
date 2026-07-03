import { EntityId } from '../../../_common/entity-id';

interface FlavorData {
    id: EntityId;
    label: string;
}

/**
 * Un SABOR del catálogo (Vainilla, Chocolate…). Entidad simple: identidad + label
 * visible. No escala (no lleva factor): es identidad de la receta, no una opción
 * de conversión. Aggregate root con su propio repositorio.
 */
export class Flavor {
    readonly id: EntityId; // Nivel 1: identidad única del sabor
    readonly label: string; // Nivel 1: nombre visible (Vainilla, Chocolate…)

    private constructor(data: FlavorData) {
        this.id = data.id;
        this.label = data.label;
    }

    static create(id: EntityId, label: string): Flavor {
        if (!label.trim()) {
            throw new Error('Flavor label is required');
        }
        return new Flavor({ id, label: label.trim() });
    }

    /** Devuelve un sabor con el label cambiado, conservando la identidad. */
    relabeledTo(label: string): Flavor {
        return Flavor.create(this.id, label);
    }

    equals(other: Flavor): boolean {
        return this.id.equals(other.id);
    }
}
