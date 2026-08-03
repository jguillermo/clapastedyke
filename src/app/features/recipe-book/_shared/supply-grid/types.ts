import type { BaseUnit } from '@core/_common/quantity';
import type { PurchaseValue } from '../price-capture/price-capture';

export type { PurchaseValue };

/** Un insumo del catálogo con su precio, para autocompletar, "jalar" el precio y resolver su id. */
export interface SupplyOption {
  id: string;
  name: string;
  baseUnit: BaseUnit;
  purchase: PurchaseValue;
}

/**
 * Línea de receta ya validada por la grilla, lista para que el form la mande a guardar. El insumo
 * llega **ya resuelto a su id**: existía en el catálogo o se guardó al confirmar su precio.
 */
export interface ParsedLine {
  supplyId: string;
  name: string;
  baseUnit: BaseUnit;
  quantity: number;
  purchase: PurchaseValue;
}
