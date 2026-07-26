import type { SupplyUsage } from '@core/recipe-book/domain/value-objects/supply-usage';

/** Etiquetas legibles de cada uso de insumo, para listas y fichas (solo presentación). */
export const USAGE_LABELS: Record<SupplyUsage, string> = {
  recipe: 'Ingrediente de receta',
  topper: 'Topper',
  box: 'Caja',
  base: 'Base',
};
