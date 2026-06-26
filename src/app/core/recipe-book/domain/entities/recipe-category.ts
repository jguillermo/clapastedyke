import { EntityId } from '../../../_common/entity-id';
import { RecipeProperty } from '../value-objects/recipe-property';
import { RecipePropertyValue } from '../value-objects/recipe-property-value';

interface RecipeCategoryData {
    id: EntityId;
    name: string;
    order: number;
    system: boolean;
    properties: RecipeProperty[];
}

/**
 * Una CATEGORÍA del recetario (Queques, Rellenos, Galletas…). Define el esquema
 * de propiedades que tendrán sus recetas. Las de sistema (`system: true`) se
 * siembran al iniciar; las demás las crea el usuario y aparecen al final
 * (`order`). Aggregate root.
 */
export class RecipeCategory {
    readonly id: EntityId; // Nivel 1: identidad única de la categoría
    readonly name: string; // Nivel 1: nombre visible (Queques, Galletas…)
    readonly order: number; // Nivel 3: orden en el índice (las nuevas, al final)
    readonly system: boolean; // Nivel 1: categoría sembrada por el sistema
    readonly properties: readonly RecipeProperty[]; // Nivel 1: esquema de propiedades de sus recetas

    private constructor(data: RecipeCategoryData) {
        this.id = data.id;
        this.name = data.name;
        this.order = data.order;
        this.system = data.system;
        this.properties = data.properties;
    }

    static create(
        id: EntityId,
        name: string,
        order: number,
        properties: RecipeProperty[],
        system = false,
    ): RecipeCategory {
        if (!name.trim()) {
            throw new Error('Category name is required');
        }
        if (!Number.isInteger(order) || order < 0) {
            throw new Error('Category order must be a non-negative integer');
        }
        const ids = new Set(properties.map((p) => p.id));
        if (ids.size !== properties.length) {
            throw new Error('Category property ids must be unique');
        }
        if (properties.filter((p) => p.role === 'scaling-weight').length > 1) {
            throw new Error('A category can have at most one scaling-weight property');
        }
        return new RecipeCategory({ id, name: name.trim(), order, system, properties: [...properties] });
    }

    /** Devuelve una categoría con el nuevo nombre y esquema, conservando las propiedades bloqueadas. */
    redefine(name: string, properties: RecipeProperty[]): RecipeCategory {
        for (const locked of this.properties.filter((p) => p.locked)) {
            const next = properties.find((p) => p.id === locked.id);
            if (!next || !next.required || !next.locked) {
                throw new Error(`Property "${locked.name}" is locked and must stay required`);
            }
        }
        return RecipeCategory.create(this.id, name, this.order, properties, this.system);
    }

    property(id: string): RecipeProperty | undefined {
        return this.properties.find((p) => p.id === id);
    }

    /** La propiedad de peso que usa el costeo del pastel, si la hay. */
    weightProperty(): RecipeProperty | undefined {
        return this.properties.find((p) => p.role === 'scaling-weight');
    }

    /** Valida los valores de una receta contra este esquema (obligatorias + tipos). */
    validateValues(values: readonly RecipePropertyValue[]): void {
        for (const property of this.properties) {
            const value = values.find((v) => v.propertyId === property.id);
            if (property.required && !value) {
                throw new Error(`Property "${property.name}" is required`);
            }
            if (value && value.type !== property.type) {
                throw new Error(`Property "${property.name}" expects type ${property.type}`);
            }
        }
        for (const value of values) {
            if (!this.property(value.propertyId)) {
                throw new Error(`Unknown property ${value.propertyId} for category ${this.name}`);
            }
        }
    }

    equals(other: RecipeCategory): boolean {
        return this.id.equals(other.id);
    }
}

/** Ids estables de las categorías de sistema (sembradas en BD vacía). */
export const SYSTEM_CATEGORY_IDS = {
    queques: 'sys-queques',
    rellenos: 'sys-rellenos',
    coberturas: 'sys-coberturas',
} as const;

/**
 * Construye las categorías de sistema. **Todas cargan el mismo esquema** (Sabor,
 * Porciones, Molde) — sin Peso. La **visibilidad** (qué aparece en el formulario)
 * se decide por categoría: por defecto **oculto**, salvo Queques (el ejemplo ya
 * configurado). Sabor es obligatorio solo donde es visible.
 */
export function buildSystemCategories(): RecipeCategory[] {
    const props = (cat: string, visible: boolean): RecipeProperty[] => [
        RecipeProperty.create(`prop-sabor-${cat}`, 'Sabor', 'flavor', visible, false, undefined, undefined, visible),
        RecipeProperty.create(`prop-porciones-${cat}`, 'Porciones', 'options', false, false, undefined, 'portions', visible),
        RecipeProperty.create(`prop-molde-${cat}`, 'Molde', 'options', false, false, undefined, 'mold', visible),
    ];

    const queques = RecipeCategory.create(new EntityId(SYSTEM_CATEGORY_IDS.queques), 'Queques', 0, props('queques', true), true);
    const rellenos = RecipeCategory.create(new EntityId(SYSTEM_CATEGORY_IDS.rellenos), 'Rellenos', 1, props('rellenos', false), true);
    const coberturas = RecipeCategory.create(new EntityId(SYSTEM_CATEGORY_IDS.coberturas), 'Coberturas', 2, props('coberturas', false), true);
    return [queques, rellenos, coberturas];
}
