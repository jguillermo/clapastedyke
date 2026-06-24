import type { RecipeBookCatalog } from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import type { Ingredient } from '@core/recipe-book/domain/entities/ingredient';
import type { IngredientLine } from '@core/recipe-book/domain/value-objects/ingredient-line';
import { FillingRecipe } from '@core/recipe-book/domain/entities/filling-recipe';
import type { CoveringRecipe } from '@core/recipe-book/domain/entities/covering-recipe';
import type { SpongeRecipe } from '@core/recipe-book/domain/entities/sponge-recipe';
import type { PageContent } from '@platform/three/book/page-content';
import { formatMoney, formatQuantity, layerChips, spongeChips } from '../_shared/recipe-format';

/** Clave de sección del libro (la lee el HUD para abrir el editor donde toca). */
export type BookSection = 'sponges' | 'fillings' | 'coverings' | 'ingredients';

/**
 * Proyecta el catálogo del libro de recetas a las páginas del libro 3D
 * ({@link PageContent}, modelo agnóstico de `platform/`). Solo presentación: usa
 * los helpers de formato compartidos; no calcula negocio.
 *
 * Secuencia: portada → divisor + una página por receta de cada sección
 * (Queques, Rellenos, Coberturas, Insumos). Cada página es UNA cara del libro y
 * lleva su `section` para que el HUD sepa qué editar/agregar.
 */
export function toPages(catalog: RecipeBookCatalog): PageContent[] {
  const pages: PageContent[] = [
    { kind: 'cover', title: 'Mi libro de recetas', subtitle: 'Recetario' },
  ];

  const byId = new Map<string, Ingredient>(catalog.ingredients.map((i) => [i.id.value, i]));
  const ingredientName = (id: string): string => byId.get(id)?.name ?? '—';

  const total =
    catalog.sponges.length +
    catalog.fillings.length +
    catalog.coverings.length +
    catalog.ingredients.length;

  if (total === 0) {
    pages.push({
      kind: 'recipe',
      title: 'Tu recetario está vacío',
      subtitle: 'Crea tu primera receta para verla escrita aquí.',
    });
    return pages;
  }

  const COLUMNS = ['Insumo', 'Cantidad'];
  const rowsOf = (lines: readonly IngredientLine[]) =>
    lines.map((l) => ({
      cells: [ingredientName(l.ingredientId.value), formatQuantity(l.quantity.value, l.quantity.unit)],
    }));

  // Las 4 secciones SIEMPRE aparecen (estructura fija del libro). Vacías → una hoja
  // con su título, para poder hojearlas y agregar la primera desde el libro.
  pushSection(pages, 'Queques', 'sponges', catalog.sponges.map((s) => spongePage(s, rowsOf(s.lines), COLUMNS)));
  pushSection(pages, 'Rellenos', 'fillings', catalog.fillings.map((f) => layerPage(f, rowsOf(f.lines), COLUMNS)));
  pushSection(
    pages,
    'Coberturas',
    'coverings',
    catalog.coverings.map((c) => layerPage(c, rowsOf(c.lines), COLUMNS)),
  );
  pushSection(pages, 'Insumos', 'ingredients', ingredientListPages(catalog.ingredients));

  return pages;
}

/** Añade el divisor de la sección y su contenido (o una hoja vacía con el título). */
function pushSection(
  pages: PageContent[],
  title: string,
  key: BookSection,
  content: PageContent[],
): void {
  pages.push(section('Sección', title, key));
  pages.push(...(content.length ? content : [emptyPage(title, key)]));
}

/** Hoja en blanco de una sección sin contenido: solo el título y una invitación. */
function emptyPage(title: string, key: BookSection): PageContent {
  return { kind: 'recipe', section: key, title, subtitle: 'Aún no tienes nada aquí.' };
}

/** Cuántos insumos caben cómodos en una cara del libro. */
const INGREDIENTS_PER_PAGE = 12;

function section(subtitle: string, title: string, key: BookSection): PageContent {
  return { kind: 'section', subtitle, title, section: key };
}

function spongePage(
  s: SpongeRecipe,
  rows: { cells: string[] }[],
  columns: string[],
): PageContent {
  return {
    kind: 'recipe',
    section: 'sponges',
    title: s.name,
    subtitle: s.flavor,
    chips: spongeChips(s),
    columns,
    rows,
    footer: `${s.lines.length} insumos`,
  };
}

function layerPage(
  layer: FillingRecipe | CoveringRecipe,
  rows: { cells: string[] }[],
  columns: string[],
): PageContent {
  return {
    kind: 'recipe',
    section: layer instanceof FillingRecipe ? 'fillings' : 'coverings',
    title: layer.name,
    chips: layerChips(layer),
    columns,
    rows,
    footer: `${layer.lines.length} insumos`,
  };
}

/**
 * Una o más páginas de lista de insumos. Tres columnas bien separadas
 * (Insumo · Cantidad · Precio) para que se lea como una tabla, no apretado.
 */
function ingredientListPages(ingredients: readonly Ingredient[]): PageContent[] {
  const sorted = [...ingredients].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const rows = sorted.map((i) => ({
    cells: [
      i.name,
      formatQuantity(i.purchasePrice.per.value, i.purchasePrice.per.unit),
      formatMoney(i.purchasePrice.amount),
    ],
  }));
  const pages: PageContent[] = [];
  for (let start = 0; start < rows.length; start += INGREDIENTS_PER_PAGE) {
    pages.push({
      kind: 'recipe',
      section: 'ingredients',
      title: 'Insumos',
      subtitle: start === 0 ? 'Lo que compras, con su precio' : undefined,
      columns: ['Insumo', 'Cantidad', 'Precio'],
      rows: rows.slice(start, start + INGREDIENTS_PER_PAGE),
      footer: `${ingredients.length} insumos`,
    });
  }
  return pages;
}
