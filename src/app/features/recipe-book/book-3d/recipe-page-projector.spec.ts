import { EntityId } from '@core/_common/entity-id';
import { Quantity } from '@core/_common/quantity';
import type { RecipeBookCatalog } from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import { SpongeRecipe } from '@core/recipe-book/domain/entities/sponge-recipe';
import { FillingRecipe } from '@core/recipe-book/domain/entities/filling-recipe';
import { IngredientLine } from '@core/recipe-book/domain/value-objects/ingredient-line';
import { RecipeYield } from '@core/recipe-book/domain/value-objects/recipe-yield';
import { makeIngredient } from '@core/recipe-book/testing/recipe-book-test-doubles';
import { toPages } from './recipe-page-projector';

function emptyCatalog(): RecipeBookCatalog {
  return { ingredients: [], sponges: [], fillings: [], coverings: [], packagingRules: [] };
}

describe('recipe-page-projector', () => {
  it('empty catalog → cover + "vacío" page', () => {
    const pages = toPages(emptyCatalog());

    expect(pages[0].kind).toBe('cover');
    expect(pages).toHaveLength(2);
    expect(pages[1].kind).toBe('recipe');
    expect(pages[1].title).toContain('vací');
  });

  it('projects a sponge with its ingredient lines into a recipe page', () => {
    const harina = makeIngredient('IN-1', 'Harina');
    const sponge = SpongeRecipe.create(
      new EntityId('SP-1'),
      'Vainilla clásica',
      RecipeYield.of(Quantity.of(2500, 'g'), 6, 'mediano'),
      [IngredientLine.of(new EntityId('IN-1'), Quantity.of(500, 'g'))],
      'Vainilla',
    );
    const catalog: RecipeBookCatalog = { ...emptyCatalog(), ingredients: [harina], sponges: [sponge] };

    const pages = toPages(catalog);

    // Las 4 secciones siempre presentes, en orden.
    expect(sectionTitles(pages)).toEqual(['Queques', 'Rellenos', 'Coberturas', 'Insumos']);
    const recipe = pages[2];
    expect(recipe.title).toBe('Vainilla clásica');
    expect(recipe.subtitle).toBe('Vainilla');
    expect(recipe.chips).toContain('2.5 kg');
    expect(recipe.columns).toEqual(['Insumo', 'Cantidad']);
    expect(recipe.rows).toEqual([{ cells: ['Harina', '500 g'] }]);
    expect(recipe.footer).toBe('1 insumos');
  });

  it('always shows the four sections, with empty ones as a titled blank page', () => {
    const catalog: RecipeBookCatalog = { ...emptyCatalog(), ingredients: [makeIngredient('IN-1', 'Harina')] };

    const pages = toPages(catalog);

    // Las 4 secciones aparecen aunque estén vacías.
    expect(sectionTitles(pages)).toEqual(['Queques', 'Rellenos', 'Coberturas', 'Insumos']);
    // Rellenos vacío → una hoja con su título y sin filas.
    const rellenos = emptyPageOf(pages, 'fillings');
    expect(rellenos?.title).toBe('Rellenos');
    expect(rellenos?.rows).toBeUndefined();
    expect(emptyPageOf(pages, 'coverings')?.title).toBe('Coberturas');
  });

  it('orders sections: queques → rellenos → coberturas → insumos', () => {
    const harina = makeIngredient('IN-1', 'Harina');
    const filling = FillingRecipe.create(
      new EntityId('FL-1'),
      'Manjar',
      Quantity.of(1000, 'g'),
      [IngredientLine.of(new EntityId('IN-1'), Quantity.of(300, 'g'))],
    );
    const catalog: RecipeBookCatalog = { ...emptyCatalog(), ingredients: [harina], fillings: [filling] };

    const pages = toPages(catalog);

    expect(sectionTitles(pages)).toEqual(['Queques', 'Rellenos', 'Coberturas', 'Insumos']);
    expect(pages.some((p) => p.title === 'Manjar')).toBe(true);
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
    // Tres columnas separadas (no apretadas): Insumo · Cantidad · Precio.
    expect(list?.columns).toEqual(['Insumo', 'Cantidad', 'Precio']);
    // Precio entero sin ceros a la derecha.
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
    // 15 insumos / 12 por página → 2 páginas de lista.
    expect(listPages).toHaveLength(2);
    expect(listPages[0].rows).toHaveLength(12);
    expect(listPages[1].rows).toHaveLength(3);
    expect(listPages[1].subtitle).toBeUndefined(); // solo la 1ª lleva bajada
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

/** La hoja vacía (sin filas) de una sección. */
function emptyPageOf(pages: ReturnType<typeof toPages>, section: string) {
  return pages.find((p) => p.kind === 'recipe' && p.section === section && !p.rows);
}
