import { BaseUnit } from '../../_common/quantity';
import { IngredientUsage } from '../domain/value-objects/ingredient-usage';

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

export interface SpongeRecipeRecord {
    id: string;
    name: string;
    flavor?: string;
    referenceYield: { weight: QuantityRecord; servings?: number; size?: string };
    lines: IngredientLineRecord[];
}

export interface FillingRecipeRecord {
    id: string;
    name: string;
    referenceWeight: QuantityRecord;
    lines: IngredientLineRecord[];
}

export type CoveringRecipeRecord = FillingRecipeRecord;

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
