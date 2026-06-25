/** Tipos de dato que puede tener una propiedad de categoría. */
export type PropertyType = 'text' | 'number' | 'weight';

/** Rol técnico de una propiedad. `scaling-weight` = el peso que usa el costeo del pastel. */
export type PropertyRole = 'scaling-weight';

interface RecipePropertyData {
    id: string;
    name: string;
    type: PropertyType;
    required: boolean;
    locked: boolean;
    role?: PropertyRole;
}

/**
 * Definición de UNA propiedad dentro del esquema de una categoría: su nombre
 * (libre, editable), su tipo, si es obligatoria y si está bloqueada. Identidad
 * por valor. `id` es estable (no cambia al renombrar), así los valores guardados
 * en las recetas no quedan huérfanos. `locked` impide eliminarla o volverla
 * opcional (lo usa el "Peso" de sistema que alimenta el costeo del pastel).
 */
export class RecipeProperty {
    readonly id: string;
    readonly name: string;
    readonly type: PropertyType;
    readonly required: boolean;
    readonly locked: boolean;
    readonly role?: PropertyRole;

    private constructor(data: RecipePropertyData) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.required = data.required;
        this.locked = data.locked;
        this.role = data.role;
    }

    static create(
        id: string,
        name: string,
        type: PropertyType,
        required: boolean,
        locked = false,
        role?: PropertyRole,
    ): RecipeProperty {
        if (!id.trim()) {
            throw new Error('Property id is required');
        }
        if (!name.trim()) {
            throw new Error('Property name is required');
        }
        // El peso de escalado siempre es de tipo peso (lo lee el costeo del pastel).
        if (role === 'scaling-weight' && type !== 'weight') {
            throw new Error('A scaling-weight property must be of type weight');
        }
        return new RecipeProperty({ id, name: name.trim(), type, required, locked, role });
    }

    equals(other: RecipeProperty): boolean {
        return (
            this.id === other.id &&
            this.name === other.name &&
            this.type === other.type &&
            this.required === other.required &&
            this.locked === other.locked &&
            this.role === other.role
        );
    }
}
