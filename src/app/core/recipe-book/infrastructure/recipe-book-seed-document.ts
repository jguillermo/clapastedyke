import { BaseUnit } from '../../_common/quantity';
import { CapacityGroup } from '../domain/entities/recipe-capacity';
import { SupplyUsage } from '../domain/value-objects/supply-usage';
import { PropertyType } from '../domain/value-objects/recipe-property';

/**
 * Forma del documento JSON del seed del libro de recetas (`public/seed/recipe-book.seed.json`).
 *
 * Es un **contrato de infraestructura** (solo primitivos), NO un modelo de dominio: el
 * {@link RecipeBookSeed} lo traduce a agregados con las factories del dominio. Todos los items
 * llevan `id` estable para permitir la semántica *create-if-absent* (si el id ya existe, no se
 * toca). Las **categorías de sistema** (Queques/Rellenos/Coberturas) NO se declaran aquí: viven
 * en `buildSystemCategories()` y se reconcilian en cada arranque; el JSON solo aporta contenido.
 */
export interface RecipeBookSeedDocument {
    /** Interruptor del seed. `false` → no se siembra contenido (las categorías de sistema sí). */
    enabled: boolean;
    /**
     * Versión del seed. Se siembra una sola vez por versión: subirla re-aplica el documento
     * (los items nuevos se crean; los existentes no se tocan). Por defecto 1.
     */
    version?: number;
    flavors?: SeedFlavor[];
    recipeCapacities?: SeedRecipeCapacity[];
    supplies?: SeedSupply[];
    /** Categorías creadas por el usuario (no de sistema). Opcional. */
    categories?: SeedCategory[];
    recipes?: SeedRecipe[];
}

export interface SeedFlavor {
    id: string;
    label: string;
}

export interface SeedRecipeCapacity {
    id: string;
    group: CapacityGroup;
    label: string;
    factor: number;
}

export interface SeedPurchasePrice {
    amount: number;
    per: { value: number; unit: BaseUnit };
    currency?: string;
}

export interface SeedSupply {
    id: string;
    name: string;
    baseUnit: BaseUnit;
    usage: SupplyUsage;
    purchasePrice: SeedPurchasePrice;
}

export interface SeedCategoryProperty {
    id: string;
    name: string;
    type: PropertyType;
    required: boolean;
    locked?: boolean;
    group?: string;
    selectable?: boolean;
}

export interface SeedCategory {
    id: string;
    name: string;
    order: number;
    properties: SeedCategoryProperty[];
}

export interface SeedRecipeValue {
    propertyId: string;
    type: PropertyType;
    /** Para flavor/options/text: label (string). Para number: number. Para weight: gramos (number). */
    value: string | number;
}

export interface SeedRecipeLine {
    supplyId: string;
    /** Cantidad en la unidad base del insumo (g o u). */
    quantity: number;
}

export interface SeedRecipe {
    id: string;
    categoryId: string;
    name: string;
    values?: SeedRecipeValue[];
    lines: SeedRecipeLine[];
}
