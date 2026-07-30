import type { RecipeBookCatalog } from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import type { Supply } from '@core/recipe-book/domain/entities/supply';
import type { Recipe } from '@core/recipe-book/domain/entities/recipe';
import type { RecipeCategory } from '@core/recipe-book/domain/entities/recipe-category';
import type { PageContent } from '@platform/three/book/page-content';
import { formatMoney, formatQuantity } from '../_shared/recipe-format';

/** Sección opaca de Insumos (la lee el HUD; nunca aparece en el índice). */
export const INGREDIENTS_SECTION = 'supplies';

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
  const pages: PageContent[] = [
    { kind: 'cover', title: 'Mi libro de recetas', subtitle: 'Recetario' },
  ];

  for (const category of catalog.categories) {
    pages.push({
      kind: 'section',
      subtitle: 'Categoría',
      title: category.name,
      section: category.id.value,
    });
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
      pages.push(...recipePages(recipe, category));
    }
  }

  pages.push(...supplyListPages(catalog.supplies));
  return pages;
}

/**
 * Filas que caben en una cara: menos en la **primera** (comparte espacio con el
 * título) y más en las de **continuación** (solo título + tabla).
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
 * Una receta es SIEMPRE una sola cara y en la textura 3D lleva **solo el título** (paper + nombre):
 * el contenido (ingredientes, preparación, imágenes) lo pinta un overlay DOM sobre la hoja, con
 * scroll nativo. Nunca se parte en páginas de continuación.
 */
function recipePages(recipe: Recipe, category: RecipeCategory): PageContent[] {
  // `overlay: true` → la textura pinta solo papel; el título y los ingredientes los dibuja el
  // overlay DOM transparente sobre la hoja (para ver el fondo real del libro 3D detrás).
  return [{ kind: 'recipe', section: category.id.value, title: recipe.name, overlay: true }];
}

/**
 * Una o más páginas de lista de insumos. Tres columnas bien separadas
 * (Insumo · Cantidad · Precio) para que se lea como una tabla, no apretado.
 */
function supplyListPages(supplies: readonly Supply[]): PageContent[] {
  const pages: PageContent[] = [
    { kind: 'section', subtitle: 'Sección', title: 'Insumos', section: INGREDIENTS_SECTION },
  ];
  if (supplies.length === 0) {
    pages.push({
      kind: 'recipe',
      section: INGREDIENTS_SECTION,
      title: 'Insumos',
      subtitle: 'Aún no tienes insumos.',
    });
    return pages;
  }
  const sorted = [...supplies].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const rows = sorted.map((i) => ({
    cells: [
      i.name,
      formatQuantity(i.purchasePrice.per.value, i.purchasePrice.per.unit),
      formatMoney(i.purchasePrice.amount),
    ],
  }));
  const total = `${supplies.length} insumos`;
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
