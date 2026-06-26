/**
 * Tipos de dato que puede tener una propiedad de categoría.
 * - `text` / `number` / `weight`: valores libres.
 * - `flavor`: selector respaldado por el catálogo de `Flavor` (guarda el label).
 * - `options`: selector respaldado por un grupo de `ConversionOption` (guarda el label);
 *   exige `group` (el grupo del catálogo del que tira el selector).
 */
export type PropertyType = 'text' | 'number' | 'weight' | 'flavor' | 'options';

/**
 * Rol técnico de una propiedad.
 * - `scaling-weight`: el peso que usa el costeo del pastel (tipo `weight`). Lo usan
 *   Rellenos/Coberturas; Queques ya no tiene peso.
 */
export type PropertyRole = 'scaling-weight';

interface RecipePropertyData {
    id: string;
    name: string;
    type: PropertyType;
    required: boolean;
    locked: boolean;
    selectable: boolean;
    role?: PropertyRole;
    group?: string;
}

/**
 * Definición de UNA propiedad dentro del esquema de una categoría: su nombre
 * (libre, editable), su tipo, si es obligatoria, si está bloqueada y si es
 * `selectable` (se muestra al SELECCIONAR la receta). Identidad por valor. `id` es
 * estable (no cambia al renombrar), así los valores guardados en las recetas no
 * quedan huérfanos. `locked` impide eliminarla o volverla opcional. `group` solo
 * aplica al tipo `options`: el grupo de `ConversionOption` que la puebla.
 */
export class RecipeProperty {
    readonly id: string;
    readonly name: string;
    readonly type: PropertyType;
    readonly required: boolean;
    readonly locked: boolean;
    readonly selectable: boolean;
    readonly role?: PropertyRole;
    readonly group?: string;

    private constructor(data: RecipePropertyData) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.required = data.required;
        this.locked = data.locked;
        this.selectable = data.selectable;
        this.role = data.role;
        this.group = data.group;
    }

    static create(
        id: string,
        name: string,
        type: PropertyType,
        required: boolean,
        locked = false,
        role?: PropertyRole,
        group?: string,
        selectable = false,
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
        // Un selector de catálogo necesita saber de qué grupo de opciones tira.
        if (type === 'options' && !group?.trim()) {
            throw new Error('An options property must declare its conversion group');
        }
        return new RecipeProperty({
            id,
            name: name.trim(),
            type,
            required,
            locked,
            selectable,
            role,
            group: group?.trim() || undefined,
        });
    }

    equals(other: RecipeProperty): boolean {
        return (
            this.id === other.id &&
            this.name === other.name &&
            this.type === other.type &&
            this.required === other.required &&
            this.locked === other.locked &&
            this.selectable === other.selectable &&
            this.role === other.role &&
            this.group === other.group
        );
    }
}
