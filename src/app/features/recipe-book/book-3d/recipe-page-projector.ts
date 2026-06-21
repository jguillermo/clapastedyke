import type { RecipeBookCatalog } from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import type { Ingredient } from '@core/recipe-book/domain/entities/ingredient';
import type { IngredientLine } from '@core/recipe-book/domain/value-objects/ingredient-line';
import type { FillingRecipe } from '@core/recipe-book/domain/entities/filling-recipe';
import type { CoveringRecipe } from '@core/recipe-book/domain/entities/covering-recipe';
import type { SpongeRecipe } from '@core/recipe-book/domain/entities/sponge-recipe';
import type { PageContent } from '@platform/three/book/page-content';
import { USAGE_LABELS } from '../_shared/ingredient-usage.labels';
import { formatQuantity, layerChips, spongeChips } from '../_shared/recipe-format';

/**
 * Proyecta el catálogo del libro de recetas a las páginas del libro 3D
 * ({@link PageContent}, modelo agnóstico de `platform/`). Solo presentación: usa
 * los helpers de formato compartidos; no calcula negocio.
 *
 * Secuencia: portada → divisor + una página por receta de cada sección
 * (Queques, Rellenos, Coberturas, Insumos). Cada página es UNA cara del libro.
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

  // --- Queques ---
  if (catalog.sponges.length) {
    pages.push(section('Sección', 'Queques'));
    for (const s of catalog.sponges) {
      pages.push(spongePage(s, rowsOf(s.lines), COLUMNS));
    }
  }

  // --- Rellenos ---
  if (catalog.fillings.length) {
    pages.push(section('Sección', 'Rellenos'));
    for (const f of catalog.fillings) {
      pages.push(layerPage(f, rowsOf(f.lines), COLUMNS));
    }
  }

  // --- Coberturas ---
  if (catalog.coverings.length) {
    pages.push(section('Sección', 'Coberturas'));
    for (const c of catalog.coverings) {
      pages.push(layerPage(c, rowsOf(c.lines), COLUMNS));
    }
  }

  // --- Insumos ---
  if (catalog.ingredients.length) {
    pages.push(section('Sección', 'Insumos'));
    for (const i of catalog.ingredients) {
      pages.push(ingredientPage(i));
    }
  }

  return pages;
}

function section(subtitle: string, title: string): PageContent {
  return { kind: 'section', subtitle, title };
}

function spongePage(
  s: SpongeRecipe,
  rows: { cells: string[] }[],
  columns: string[],
): PageContent {
  return {
    kind: 'recipe',
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
    title: layer.name,
    chips: layerChips(layer),
    columns,
    rows,
    footer: `${layer.lines.length} insumos`,
  };
}

function ingredientPage(i: Ingredient): PageContent {
  const price = i.purchasePrice;
  return {
    kind: 'recipe',
    title: i.name,
    subtitle: USAGE_LABELS[i.usage],
    chips: [`S/ ${price.amount} · ${formatQuantity(price.per.value, price.per.unit)}`],
  };
}
