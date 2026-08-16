import { BaseUnit } from '../../_common/quantity';
import { CapacityGroup } from '../domain/entities/recipe-capacity';
import { SupplyUsage } from '../domain/value-objects/supply-usage';
import { SyncedRecord } from './synced-record';

/**
 * Documentos de almacenamiento planos (solo primitivos) persistidos en IndexedDB. Son contratos
 * de infraestructura — nunca modelos de dominio. La traducción agregado ⇄ record vive en los
 * mappers (la capa anticorrupción hacia el almacenamiento).
 *
 * Los cinco agregados extienden `SyncedRecord`: cuándo se guardó por última vez y si está borrado. Los
 * dos campos son **opcionales**, que es exactamente lo que tienen los documentos escritos antes de que
 * existieran — leer nunca se rompe por su ausencia.
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

export interface RecipeIngredientRecord {
  // Clave persistida legacy: se conserva `ingredientId` (renombrarla orfanaría recetas guardadas);
  // el dominio la mapea a `RecipeIngredient.supplyId`.
  ingredientId: string;
  quantity: QuantityRecord;
}

export interface SupplyRecord extends SyncedRecord {
  id: string;
  name: string;
  baseUnit: BaseUnit;
  usage: SupplyUsage;
  purchasePrice: PurchasePriceRecord;
}

export interface RecipeFlavorRecord extends SyncedRecord {
  id: string;
  label: string;
}

export interface RecipeCapacityRecord extends SyncedRecord {
  id: string;
  group: CapacityGroup;
  label: string;
  factor: number;
}

export interface RecipeCategoryRecord extends SyncedRecord {
  id: string;
  name: string;
}

export interface RecipeRecord extends SyncedRecord {
  id: string;
  categoryId: string;
  name: string;
  // Clave persistida legacy `lines`; el dominio la expone como `Recipe.ingredients`.
  lines: RecipeIngredientRecord[];
  flavorId?: string | null; // opcional por retrocompatibilidad con records escritos antes del sabor
  portionsCapacityId?: string | null; // opcional por retrocompatibilidad con records escritos antes de la capacidad
  moldCapacityId?: string | null; // opcional por retrocompatibilidad con records escritos antes de la capacidad
}
