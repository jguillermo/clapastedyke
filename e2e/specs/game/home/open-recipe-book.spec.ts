import { test, expect } from '../../../fixtures/app-fixture';

/**
 * Punto de entrada al libro de recetas desde la cocina: la estación abre el libro a
 * pantalla completa y `Volver` regresa al mundo. El flujo se cierra siempre en un
 * estado terminal: libro montado, o libro desmontado con la cocina de vuelta.
 */
test.describe('Home 3D · abrir el libro de recetas', () => {
  test.use({ webgl: true });

  test('estación libro de recetas → se abre el libro a pantalla completa', async ({
    openHome,
    home,
    book,
  }) => {
    await openHome();

    await home.station('Libro de recetas').click();

    await book.waitReady();
    await expect(book.title).toBeVisible();
    await expect(book.pager).toBeVisible();
  });

  test('libro abierto → Volver → vuelve la cocina con el dock operable', async ({
    openHome,
    home,
    book,
  }) => {
    await openHome();
    await home.station('Libro de recetas').click();
    await book.waitReady();

    await book.back.click();

    await expect(book.root).toHaveCount(0);
    await expect(home.canvas).toBeVisible();
    await expect(home.station('Libro de recetas')).toBeEnabled();
  });

  test('libro abierto → Escape → vuelve la cocina', async ({ openHome, home, book, page }) => {
    await openHome();
    await home.station('Libro de recetas').click();
    await book.waitReady();

    await page.keyboard.press('Escape');

    await expect(book.root).toHaveCount(0);
    await expect(home.coach).toBeVisible();
  });

  test('abrir → volver → abrir de nuevo → el libro se remonta una sola vez', async ({
    openHome,
    home,
    book,
  }) => {
    await openHome();

    await home.station('Libro de recetas').click();
    await book.waitReady();
    await book.back.click();
    await expect(book.root).toHaveCount(0);

    await home.station('Libro de recetas').click();
    await book.waitReady();

    await expect(book.root).toHaveCount(1);
    await expect(book.canvas).toHaveCount(1);
  });

  test('clics repetidos en la estación → el libro no se duplica', async ({ openHome, home, book }) => {
    await openHome();
    const station = home.station('Libro de recetas');

    await station.click();
    await station.click({ force: true });
    await book.waitReady();

    await expect(book.root).toHaveCount(1);
  });
});
