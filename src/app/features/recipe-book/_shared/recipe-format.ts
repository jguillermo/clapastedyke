import { BaseUnit } from '@core/_common/quantity';
import type { Recipe } from '@core/recipe-book/domain/entities/recipe';
import type { RecipeCategory } from '@core/recipe-book/domain/entities/recipe-category';

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

/**
 * Formatea un precio con símbolo. Entero → sin decimales (`S/ 12`); con decimales
 * → 2 cifras (`S/ 12.50`). No añade ceros a la derecha a los enteros.
 */
export function formatMoney(amount: number): string {
  return `S/ ${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

/**
 * Chips de una receta a partir de los valores de las propiedades de su categoría,
 * en el orden del esquema. Peso → "1 kg"; número → "4 porciones"; texto → su valor.
 */
export function recipeChips(recipe: Recipe, category: RecipeCategory): string[] {
  const chips: string[] = [];
  for (const property of category.properties) {
    const value = recipe.valueOf(property.id);
    if (!value) {
      continue;
    }
    if (property.type === 'weight') {
      chips.push(formatWeight(value.asWeight().value));
    } else if (property.type === 'number') {
      chips.push(`${value.value} ${property.name.toLowerCase()}`);
    } else {
      chips.push(String(value.value));
    }
  }
  return chips;
}
