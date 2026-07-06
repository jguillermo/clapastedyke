import { BaseUnit } from '../../_common/quantity';
import { CapacityGroup } from '../domain/entities/recipe-capacity';
import { SupplyUsage } from '../domain/value-objects/supply-usage';
import { PropertyRole, PropertyType } from '../domain/value-objects/recipe-property';

/**
 * Documentos de almacenamiento planos (solo primitivos) persistidos en IndexedDB. Son contratos
 * de infraestructura — nunca modelos de dominio. La traducción agregado ⇄ record vive en los
 * mappers (la capa anticorrupción hacia el almacenamiento).
 */

export interface QuantityRecord {
    value: number;
    unit: BaseUnit;
}

export interface PurchasePriceRecord {
    amount: number;
    per: QuantityRecord;
    currency?: string; // opcional por retrocompatibilidad con records escritos antes de añadir la moneda
}

export interface SupplyLineRecord {
    // Clave persistida legacy: se conserva `ingredientId` (renombrarla orfanaría recetas guardadas);
    // el dominio la mapea a `SupplyLine.supplyId`.
    ingredientId: string;
    quantity: QuantityRecord;
}

export interface SupplyRecord {
    id: string;
    name: string;
    baseUnit: BaseUnit;
    usage: SupplyUsage;
    purchasePrice: PurchasePriceRecord;
}

export interface RecipePropertyRecord {
    id: string;
    name: string;
    type: PropertyType;
    required: boolean;
    locked: boolean;
    role?: PropertyRole;
    group?: string; // solo propiedades `options`: grupo del catálogo de capacidades
    selectable?: boolean; // se muestra al seleccionar la receta (default true para records viejos)
}

export interface FlavorRecord {
    id: string;
    label: string;
}

export interface RecipeCapacityRecord {
    id: string;
    group: CapacityGroup;
    label: string;
    factor: number;
}

export interface RecipeCategoryRecord {
    id: string;
    name: string;
    order: number;
    system: boolean;
    properties: RecipePropertyRecord[];
}

export interface RecipePropertyValueRecord {
    propertyId: string;
    type: PropertyType;
    value: string | number | QuantityRecord;
}

export interface RecipeRecord {
    id: string;
    categoryId: string;
    name: string;
    values: RecipePropertyValueRecord[];
    lines: SupplyLineRecord[];
}
