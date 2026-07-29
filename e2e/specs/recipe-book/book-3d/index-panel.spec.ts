import { test, expect } from '../../../fixtures/app-fixture';
import { CATEGORIES, GLASEADO, RECIPES } from '../../../support/seed';

/**
 * Panel de índice del libro 3D: se abre desde la barra inferior, lista **cada categoría con todas
 * sus recetas** (Queques, Rellenos, Coberturas) y **nunca los insumos**, salta a la receta elegida y
 * se cierra con su ×, con Escape o volviendo a pulsar el botón.
 */
test.describe('Libro 3D · índice', () => {
  test.use({ webgl: true });

  /** Todas las recetas sembradas, en el orden en que las lista el índice (por categoría, alfabéticas). */
  const ALL_RECIPES = CATEGORIES.flatMap((category) => RECIPES[category]);

  test('Índice → las tres categorías con todas sus recetas y ningún insumo → Cerrar → vuelve el libro operable', async ({
    openBook3d,
    book,
  }) => {
    await openBook3d();

    await book.indexToggle.click();
    await expect(book.indexPanel).toBeVisible();
    for (const category of CATEGORIES) {
      await expect(book.indexSection(category)).toBeVisible();
    }
    // Un salto por receta del catálogo, ni uno más: los insumos no son recetas y no se listan.
    await expect(book.indexRecipes).toHaveCount(ALL_RECIPES.length);
    for (const recipe of ALL_RECIPES) {
      await expect(book.indexRecipe(recipe)).toBeVisible();
    }
    await expect(book.indexSection('Insumos')).toHaveCount(0);

    await book.indexClose.click();
    await expect(book.indexPanel).toHaveCount(0);
    await expect(book.pager).toBeVisible();
    await expect(book.next).toBeEnabled();
  });

  test('Índice → elegir una receta → el panel se cierra y el libro salta a su página', async ({
    openBook3d,
    book,
    overlay,
  }) => {
    await openBook3d();

    await book.indexToggle.click();
    await expect(book.indexPanel).toBeVisible();
    await book.indexRecipe(GLASEADO.name).click();

    await expect(book.indexPanel).toHaveCount(0);
    await expect(overlay.byName(GLASEADO.name).first()).toBeVisible();
  });

  test('Índice → Escape → cierra solo el índice, el libro sigue abierto y paginable', async ({
    openBook3d,
    book,
    page,
  }) => {
    await openBook3d();

    await book.indexToggle.click();
    await expect(book.indexPanel).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(book.indexPanel).toHaveCount(0);
    await expect(book.canvas).toBeVisible();
    await book.goNext();
    await expect(book.announce).not.toHaveText('Portada');
  });

  test('Índice abierto → Escape cierra el índice → Escape otra vez → se cierra el libro', async ({
    openBook3d,
    book,
    home,
    page,
  }) => {
    await openBook3d();

    await book.indexToggle.click();
    await page.keyboard.press('Escape');
    await expect(book.indexPanel).toHaveCount(0);

    await page.keyboard.press('Escape');

    await expect(book.root).toHaveCount(0);
    await expect(home.dock).toBeVisible();
  });

  test('Índice → mismo botón otra vez → se cierra sin navegar', async ({ openBook3d, book }) => {
    await openBook3d();
    const before = await book.announce.innerText();

    await book.indexToggle.click();
    await expect(book.indexPanel).toBeVisible();
    await book.indexToggle.click();

    await expect(book.indexPanel).toHaveCount(0);
    await expect(book.announce).toHaveText(before);
  });

  test('Índice abierto en una página de receta → cerrarlo deja la receta a la vista', async ({
    openBook3d,
    book,
    overlay,
  }) => {
    await openBook3d();
    await book.goToFirstRecipe();
    const title = await overlay.title(0).innerText();

    await book.indexToggle.click();
    await expect(book.indexPanel).toBeVisible();
    await book.indexClose.click();

    await expect(book.indexPanel).toHaveCount(0);
    await expect(overlay.title(0)).toHaveText(title);
  });

  test('el cierre del índice es un target táctil enfocable por teclado', async ({
    openBook3d,
    book,
  }) => {
    await openBook3d();

    await book.indexToggle.click();
    await book.indexClose.focus();
    await expect(book.indexClose).toBeFocused();

    const box = (await book.indexToggle.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);

    await book.indexClose.press('Enter');
    await expect(book.indexPanel).toHaveCount(0);
  });
});
