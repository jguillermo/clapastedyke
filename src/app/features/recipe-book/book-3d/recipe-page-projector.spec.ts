import { EntityId } from '@core/_common/entity-id';
import { Quantity } from '@core/_common/quantity';
import type { RecipeBookCatalog } from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import { IngredientLine } from '@core/recipe-book/domain/value-objects/ingredient-line';
import { makeIngredient, makeRecipe, makeWeightCategory } from '@core/recipe-book/testing/recipe-book-test-doubles';
import { toPages } from './recipe-page-projector';

function emptyCatalog(): RecipeBookCatalog {
  return { ingredients: [], categories: [], recipes: [], packagingRules: [] };
}

describe('recipe-page-projector', () => {
  it('empty catalog → cover + Insumos section (sin categorías)', () => {
    const pages = toPages(emptyCatalog());

    expect(pages[0].kind).toBe('cover');
    expect(sectionTitles(pages)).toEqual(['Insumos']);
    // sin insumos → una hoja de Insumos vacía
    expect(pages.some((p) => p.section === 'ingredients' && p.subtitle?.includes('Aún'))).toBe(true);
  });

  it('projects a recipe with its ingredient lines into a recipe page', () => {
    const harina = makeIngredient('IN-1', 'Harina');
    const category = makeWeightCategory('cat-q', 'Queques');
    const recipe = makeRecipe('RE-1', 'cat-q', 'Vainilla clásica', 2500, [
      IngredientLine.of(new EntityId('IN-1'), Quantity.of(500, 'g')),
    ]);
    const catalog: RecipeBookCatalog = { ...emptyCatalog(), ingredients: [harina], categories: [category], recipes: [recipe] };

    const pages = toPages(catalog);

    expect(sectionTitles(pages)).toEqual(['Queques', 'Insumos']);
    const recipePage = pages.find((p) => p.kind === 'recipe' && p.title === 'Vainilla clásica');
    expect(recipePage?.chips).toContain('2.5 kg');
    expect(recipePage?.columns).toEqual(['Insumo', 'Cantidad']);
    expect(recipePage?.rows).toEqual([{ cells: ['Harina', '500 g'] }]);
    expect(recipePage?.footer).toBe('1 insumos');
  });

  it('an empty category shows a titled blank page', () => {
    const category = makeWeightCategory('cat-g', 'Galletas');
    const catalog: RecipeBookCatalog = { ...emptyCatalog(), categories: [category] };

    const pages = toPages(catalog);
    const empty = pages.find((p) => p.kind === 'recipe' && p.section === 'cat-g' && !p.rows);
    expect(empty?.title).toBe('Galletas');
    expect(empty?.rows).toBeUndefined();
  });

  it('projects insumos as a single list page (not one page per insumo)', () => {
    const catalog: RecipeBookCatalog = {
      ...emptyCatalog(),
      ingredients: [
        makeIngredient('IN-1', 'Harina', { amount: 5, per: Quantity.of(1000, 'g') }),
        makeIngredient('IN-2', 'Huevos', { baseUnit: 'u', amount: 12, per: Quantity.of(4, 'u') }),
      ],
    };

    const list = ingredientListOf(toPages(catalog));
    expect(list?.title).toBe('Insumos');
    expect(list?.section).toBe('ingredients');
    expect(list?.columns).toEqual(['Insumo', 'Cantidad', 'Precio']);
    expect(list?.rows).toEqual([
      { cells: ['Harina', '1 kg', 'S/ 5'] },
      { cells: ['Huevos', '4 u', 'S/ 12'] },
    ]);
    expect(list?.footer).toBe('2 insumos');
  });

  it('keeps decimals when the price is not an integer', () => {
    const catalog: RecipeBookCatalog = {
      ...emptyCatalog(),
      ingredients: [makeIngredient('IN-1', 'Canela', { amount: 12.5, per: Quantity.of(200, 'g') })],
    };
    expect(ingredientListOf(toPages(catalog))?.rows?.[0].cells[2]).toBe('S/ 12.50');
  });

  it('lists insumos in alphabetical order', () => {
    const catalog: RecipeBookCatalog = {
      ...emptyCatalog(),
      ingredients: [
        makeIngredient('IN-1', 'Zanahoria'),
        makeIngredient('IN-2', 'Azúcar'),
        makeIngredient('IN-3', 'harina'),
      ],
    };

    const list = ingredientListOf(toPages(catalog));
    expect(list?.rows?.map((r) => r.cells[0])).toEqual(['Azúcar', 'harina', 'Zanahoria']);
  });

  it('paginates insumos when there are more than fit on one page', () => {
    const ingredients = Array.from({ length: 15 }, (_, n) =>
      makeIngredient(`IN-${n}`, `Insumo ${n}`, { amount: 1, per: Quantity.of(1000, 'g') }),
    );
    const catalog: RecipeBookCatalog = { ...emptyCatalog(), ingredients };

    const listPages = toPages(catalog).filter((p) => p.section === 'ingredients' && p.rows);
    expect(listPages).toHaveLength(2);
    expect(listPages[0].rows).toHaveLength(10); // primera cara: 10 (comparte con el subtítulo)
    expect(listPages[1].rows).toHaveLength(5); // continuación: el resto
    expect(listPages[0].continued).toBeFalsy();
    expect(listPages[1].continued).toBe(true);
    expect(listPages[1].subtitle).toBe('continuación');
  });

  it('paginates a recipe with many insumos onto continuation pages (out of the index)', () => {
    const ingredients = Array.from({ length: 15 }, (_, n) => makeIngredient(`IN-${n}`, `Insumo ${n}`));
    const category = makeWeightCategory('cat-q', 'Queques');
    const recipe = makeRecipe(
      'RE-1',
      'cat-q',
      'Receta grande',
      2500,
      ingredients.map((i) => IngredientLine.of(new EntityId(i.id.value), Quantity.of(100, 'g'))),
    );
    const catalog: RecipeBookCatalog = { ...emptyCatalog(), ingredients, categories: [category], recipes: [recipe] };

    const recipePages = toPages(catalog).filter((p) => p.kind === 'recipe' && p.section === 'cat-q');
    expect(recipePages).toHaveLength(2);
    expect(recipePages[0].rows).toHaveLength(10);
    expect(recipePages[0].chips).toContain('2.5 kg'); // chips solo en la primera
    expect(recipePages[0].footer).toBe('Continúa…');
    expect(recipePages[1].rows).toHaveLength(5);
    expect(recipePages[1].continued).toBe(true);
    expect(recipePages[1].chips).toBeUndefined();
    expect(recipePages[1].footer).toBe('15 insumos');
  });
});

/** Títulos de los divisores de sección, en orden. */
function sectionTitles(pages: { kind: string; title?: string }[]): string[] {
  return pages.filter((p) => p.kind === 'section').map((p) => p.title ?? '');
}

/** La página de lista de insumos (la que tiene filas). */
function ingredientListOf(pages: ReturnType<typeof toPages>) {
  return pages.find((p) => p.section === 'ingredients' && p.rows);
}
