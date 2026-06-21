import type { IngredientUsage } from '@core/recipe-book/domain/value-objects/ingredient-usage';

/** Etiquetas legibles de cada uso de insumo, para listas y fichas (solo presentación). */
export const USAGE_LABELS: Record<IngredientUsage, string> = {
  recipe: 'Ingrediente de receta',
  topper: 'Topper',
  box: 'Caja',
  base: 'Base',
};
