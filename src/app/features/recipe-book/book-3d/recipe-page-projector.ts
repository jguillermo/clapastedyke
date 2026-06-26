import type { RecipeBookCatalog } from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import type { Ingredient } from '@core/recipe-book/domain/entities/ingredient';
import type { Recipe } from '@core/recipe-book/domain/entities/recipe';
import type { RecipeCategory } from '@core/recipe-book/domain/entities/recipe-category';
import type { IngredientLine } from '@core/recipe-book/domain/value-objects/ingredient-line';
import type { PageContent } from '@platform/three/book/page-content';
import { formatMoney, formatQuantity, recipeChips } from '../_shared/recipe-format';

/** Sección opaca de Insumos (la lee el HUD; nunca aparece en el índice). */
export const INGREDIENTS_SECTION = 'ingredients';

/**
 * Proyecta el catálogo del libro de recetas a las páginas del libro 3D
 * ({@link PageContent}, modelo agnóstico de `platform/`). Solo presentación.
 *
 * Secuencia: portada → por cada **categoría** (ordenada) un divisor + una página
 * por receta (alfabética) (o una hoja vacía) → al final las páginas de Insumos.
 * `PageContent.section` lleva el `categoryId` (o `INGREDIENTS_SECTION`) para que
 * el HUD sepa a qué categoría agregar/editar.
 */
export function toPages(catalog: RecipeBookCatalog): PageContent[] {
  const pages: PageContent[] = [{ kind: 'cover', title: 'Mi libro de recetas', subtitle: 'Recetario' }];

  const ingredientName = nameResolver(catalog.ingredients);
  const COLUMNS = ['Insumo', 'Cantidad'];
  const rowsOf = (lines: readonly IngredientLine[]) =>
    lines.map((l) => ({
      cells: [ingredientName(l.ingredientId.value), formatQuantity(l.quantity.value, l.quantity.unit)],
    }));

  for (const category of catalog.categories) {
    pages.push({ kind: 'section', subtitle: 'Categoría', title: category.name, section: category.id.value });
    const recipes = catalog.recipes
      .filter((r) => r.categoryId.value === category.id.value)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    if (recipes.length === 0) {
      pages.push({
        kind: 'recipe',
        section: category.id.value,
        title: category.name,
        subtitle: 'Aún no tienes nada aquí.',
      });
      continue;
    }
    for (const recipe of recipes) {
      pages.push(...recipePages(recipe, category, rowsOf(recipe.lines), COLUMNS));
    }
  }

  pages.push(...ingredientListPages(catalog.ingredients));
  return pages;
}

function nameResolver(ingredients: readonly Ingredient[]): (id: string) => string {
  const byId = new Map(ingredients.map((i) => [i.id.value, i] as const));
  return (id) => byId.get(id)?.name ?? '—';
}

/**
 * Filas que caben en una cara: menos en la **primera** (comparte espacio con el
 * título y los chips) y más en las de **continuación** (solo título + tabla).
 */
const ROWS_FIRST = 10;
const ROWS_CONT = 14;

/** Reparte filas en grupos: la primera con `first`, el resto con `rest`. */
function chunkRows<T>(items: readonly T[], first: number, rest: number): T[][] {
  if (items.length === 0) return [];
  const groups: T[][] = [items.slice(0, first)];
  for (let i = first; i < items.length; i += rest) {
    groups.push(items.slice(i, i + rest));
  }
  return groups;
}

/**
 * Una receta como una o varias caras: la primera con título + chips + tabla; si
 * los insumos no caben, **continúan** en las siguientes (marcadas `continued`,
 * fuera del índice). El pie muestra «Continúa…» salvo en la última (total).
 */
function recipePages(
  recipe: Recipe,
  category: RecipeCategory,
  rows: { cells: string[] }[],
  columns: string[],
): PageContent[] {
  const chips = recipeChips(recipe, category);
  const total = `${recipe.lines.length} insumos`;
  const groups = chunkRows(rows, ROWS_FIRST, ROWS_CONT);
  if (groups.length <= 1) {
    return [{ kind: 'recipe', section: category.id.value, title: recipe.name, chips, columns, rows, footer: total }];
  }
  return groups.map((group, i) => {
    const last = i === groups.length - 1;
    return i === 0
      ? { kind: 'recipe', section: category.id.value, title: recipe.name, chips, columns, rows: group, footer: 'Continúa…' }
      : {
          kind: 'recipe',
          section: category.id.value,
          title: recipe.name,
          subtitle: 'continuación',
          columns,
          rows: group,
          continued: true,
          footer: last ? total : 'Continúa…',
        };
  });
}

/**
 * Una o más páginas de lista de insumos. Tres columnas bien separadas
 * (Insumo · Cantidad · Precio) para que se lea como una tabla, no apretado.
 */
function ingredientListPages(ingredients: readonly Ingredient[]): PageContent[] {
  const pages: PageContent[] = [
    { kind: 'section', subtitle: 'Sección', title: 'Insumos', section: INGREDIENTS_SECTION },
  ];
  if (ingredients.length === 0) {
    pages.push({
      kind: 'recipe',
      section: INGREDIENTS_SECTION,
      title: 'Insumos',
      subtitle: 'Aún no tienes insumos.',
    });
    return pages;
  }
  const sorted = [...ingredients].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const rows = sorted.map((i) => ({
    cells: [
      i.name,
      formatQuantity(i.purchasePrice.per.value, i.purchasePrice.per.unit),
      formatMoney(i.purchasePrice.amount),
    ],
  }));
  const total = `${ingredients.length} insumos`;
  const groups = chunkRows(rows, ROWS_FIRST, ROWS_CONT);
  groups.forEach((group, i) => {
    const last = i === groups.length - 1;
    pages.push({
      kind: 'recipe',
      section: INGREDIENTS_SECTION,
      title: 'Insumos',
      subtitle: i === 0 ? 'Lo que compras, con su precio' : 'continuación',
      columns: ['Insumo', 'Cantidad', 'Precio'],
      rows: group,
      continued: i > 0,
      footer: last ? total : 'Continúa…',
    });
  });
  return pages;
}
