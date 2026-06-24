import type { BaseUnit } from '@core/_common/quantity';
import type { PurchaseValue } from '../price-capture/price-capture';

export type { PurchaseValue };

/** Un insumo del catálogo con su precio, para autocompletar y "jalar" el precio. */
export interface IngredientOption {
  name: string;
  baseUnit: BaseUnit;
  purchase: PurchaseValue;
}

/** Línea de receta ya validada por la grilla, lista para que el form la persista. */
export interface ParsedLine {
  name: string;
  baseUnit: BaseUnit;
  quantity: number;
  purchase: PurchaseValue;
}
