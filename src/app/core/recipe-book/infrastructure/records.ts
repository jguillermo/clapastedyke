import { BaseUnit } from '../../_common/quantity';
import { IngredientUsage } from '../domain/value-objects/ingredient-usage';
import { PropertyRole, PropertyType } from '../domain/value-objects/recipe-property';

/**
 * Flat storage documents (primitives only) persisted in IndexedDB. They are
 * infrastructure contracts — never domain models. The aggregate ⇄ record
 * translation lives in the mappers (the Anticorruption Layer toward storage).
 */

export interface QuantityRecord {
    value: number;
    unit: BaseUnit;
}

export interface PurchasePriceRecord {
    amount: number;
    per: QuantityRecord;
    currency?: string; // optional for backward-compat with records written before currency was added
}

export interface IngredientLineRecord {
    ingredientId: string;
    quantity: QuantityRecord;
}

export interface IngredientRecord {
    id: string;
    name: string;
    baseUnit: BaseUnit;
    usage: IngredientUsage;
    purchasePrice: PurchasePriceRecord;
}

export interface RecipePropertyRecord {
    id: string;
    name: string;
    type: PropertyType;
    required: boolean;
    locked: boolean;
    role?: PropertyRole;
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
    lines: IngredientLineRecord[];
}

export interface PackagingRuleRecord {
    id: string;
    range: { min: QuantityRecord; max: QuantityRecord };
    boxId: string;
    baseId: string;
}

export interface CakeCompositionRecord {
    id: string;
    name?: string;
    targetWeight: QuantityRecord;
    spongeRecipeId: string;
    fillingRecipeId: string;
    coveringRecipeId: string;
    topperId?: string;
    suggestedBoxId: string;
    suggestedBaseId: string;
}

export interface PriceHistoryEntryRecord {
    id: string;
    ingredientId: string;
    price: PurchasePriceRecord;
    recordedAt: string;
}
