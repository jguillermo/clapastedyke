import { test, expect } from '../../../fixtures/app-fixture';
import { CATEGORIES, RECIPES } from '../../../support/seed';

/**
 * Ruta accesible del libro (`app-recipe-book-3d` sin WebGL): una lista DOM con las
 * mismas acciones que el 3D. Aquí se comprueba que el catálogo sembrado se proyecta
 * completo: categorías ordenadas, recetas alfabéticas dentro de cada una, y las
 * acciones de crear/editar/gestionar insumos presentes.
 */
test.describe('Libro de recetas · lista accesible', () => {
  test('abrir el libro → lista las tres categorías en orden alfabético', async ({ openCatalog }) => {
    const catalog = await openCatalog();

    await expect(catalog.categoryHeadings).toHaveCount(CATEGORIES.length);
    await expect(catalog.categoryHeadings).toHaveText([...CATEGORIES]);
  });

  test.describe('recetas por categoría', () => {
    for (const category of CATEGORIES) {
      test(`categoría ${category} → lista sus recetas sembradas en orden alfabético`, async ({
        openCatalog,
      }) => {
        const catalog = await openCatalog();

        expect(await catalog.recipeNamesIn(category)).toEqual([...RECIPES[category]]);
      });
    }
  });

  test('abrir el libro → cada categoría ofrece su acción de crear receta', async ({ openCatalog }) => {
    const catalog = await openCatalog();

    for (const category of CATEGORIES) {
      await expect(catalog.newRecipeIn(category)).toBeEnabled();
    }
  });

  test('abrir el libro → ofrece la acción de gestionar insumos y volver', async ({ openCatalog }) => {
    const catalog = await openCatalog();

    await expect(catalog.suppliesButton).toBeEnabled();
    await expect(catalog.back).toBeEnabled();
  });

  test('abrir el libro → Volver → el libro se desmonta y queda la cocina', async ({
    openCatalog,
    catalog,
    home,
  }) => {
    await openCatalog();

    await catalog.back.click();

    await expect(catalog.root).toHaveCount(0);
    await expect(home.dock).toBeVisible();
  });
});
