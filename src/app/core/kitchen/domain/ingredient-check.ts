import { BaseUnit } from '../../_common/domain/quantity';
import { StockStatus } from '../../catalog/domain/supply/supply';

/** Resultado por ingrediente al revisar si alcanza para cocinar. */
export interface IngredientCheck {
  supplyId: string;
  name: string;
  unit: BaseUnit;
  needed: number;
  have: number;
  status: StockStatus; // EMPTY: nada · LOW: insuficiente · OK: alcanza
  enough: boolean;
}

/** Revisión completa de una receta: qué necesito vs qué tengo. */
export interface RecipeCheck {
  recipeId: string;
  recipeName: string;
  servings: number;
  canCook: boolean;
  items: IngredientCheck[];
}
