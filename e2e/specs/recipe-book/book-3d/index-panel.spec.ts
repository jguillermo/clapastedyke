import { test, expect } from '../../../fixtures/app-fixture';
import { CATEGORIES } from '../../../support/seed';

/**
 * Panel de índice del libro 3D: se abre desde la barra inferior, lista las categorías y se cierra con
 * su ×, con Escape o volviendo a pulsar el botón.
 *
 * > **BUG conocido — el índice no lista recetas.** `buildIndex` (en `recipe-book-3d.ts`) solo añade
 * > una entrada de receta si su página trae `rows` o `chips`; desde que el contenido de la receta se
 * > pinta con un overlay DOM (`recipePages` devuelve `{ kind: 'recipe', overlay: true }`, sin `rows`
 * > ni `chips`), **ninguna receta entra al índice** y el panel queda sin saltos: solo los rótulos de
 * > categoría, que no son navegables. Los tests de abajo documentan el comportamiento ACTUAL; cuando
 * > se corrija, el test marcado con «BUG» se sustituye por los saltos reales (elegir receta → el
 * > panel se cierra y el libro salta a su página).
 */
test.describe('Libro 3D · índice', () => {
  test.use({ webgl: true });

  test('Índice → lista las tres categorías como rótulos → Cerrar → vuelve el libro operable', async ({
    openBook3d,
    book,
  }) => {
    await openBook3d();

    await book.indexToggle.click();
    await expect(book.indexPanel).toBeVisible();
    for (const category of CATEGORIES) {
      await expect(book.indexSection(category)).toBeVisible();
    }

    await book.indexClose.click();
    await expect(book.indexPanel).toHaveCount(0);
    await expect(book.pager).toBeVisible();
    await expect(book.next).toBeEnabled();
  });

  /**
   * BUG (ver la cabecera del fichero): el panel debería ofrecer un salto por receta y hoy no ofrece
   * ninguno. Se asserta el estado actual para que la corrección haga fallar este test.
   */
  test('BUG · Índice → no ofrece ningún salto de receta, solo rótulos de categoría', async ({
    openBook3d,
    book,
  }) => {
    await openBook3d();

    await book.indexToggle.click();
    await expect(book.indexPanel).toBeVisible();

    await expect(book.indexRecipes).toHaveCount(0);
    await expect(book.indexRecipe('Glaseado de Queso Crema')).toHaveCount(0);

    await book.indexClose.click();
    await expect(book.indexPanel).toHaveCount(0);
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
