import { BaseUnit } from '@core/_common/quantity';
import type { SpongeRecipe } from '@core/recipe-book/domain/entities/sponge-recipe';
import type { FillingRecipe } from '@core/recipe-book/domain/entities/filling-recipe';
import type { CoveringRecipe } from '@core/recipe-book/domain/entities/covering-recipe';

/**
 * Helpers de **presentación** del libro de recetas (solo formato, sin cálculo de
 * negocio). Compartidos entre el hub DOM ({@link RecipeBook}) y el libro 3D
 * ({@link recipe-page-projector}) para no duplicar el formateo.
 */

/** Formatea gramos a una etiqueta legible (kg/g). */
export function formatWeight(grams: number): string {
  return grams >= 1000 ? `${+(grams / 1000).toFixed(2)} kg` : `${grams} g`;
}

/** Formatea una cantidad a una etiqueta legible (g/kg/u). */
export function formatQuantity(value: number, unit: BaseUnit): string {
  return unit === 'u' ? `${value} u` : formatWeight(value);
}

/** Chips de características de un queque (sabor, peso, tamaño, porciones). */
export function spongeChips(s: SpongeRecipe): string[] {
  const chips: string[] = [];
  if (s.flavor) chips.push(s.flavor);
  chips.push(formatWeight(s.referenceYield.weight.value));
  if (s.referenceYield.size) chips.push(s.referenceYield.size);
  if (s.referenceYield.servings) chips.push(`${s.referenceYield.servings} porciones`);
  return chips;
}

/** Chips de una capa (relleno/cobertura): su peso de referencia. */
export function layerChips(layer: FillingRecipe | CoveringRecipe): string[] {
  return [`Rinde ${formatWeight(layer.referenceWeight.value)}`];
}
