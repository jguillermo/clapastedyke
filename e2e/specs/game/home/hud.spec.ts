import { test, expect } from '../../../fixtures/app-fixture';

/**
 * HUD mínimo del Nivel 0: la cabecera con la insignia de nivel y el título del nivel.
 * Es DOM sobre el canvas, así que se lee y se mide como cualquier otro bloque.
 */
test.describe('Home 3D · HUD de nivel', () => {
  test.use({ webgl: true });

  test('mundo cargado → la cabecera anuncia el nivel y su título', async ({ openHome }) => {
    const home = await openHome();

    await expect(home.levelBadge).toBeVisible();
    await expect(home.levelTitle).toHaveText('El libro de recetas en blanco');
  });

  test('mundo cargado → la cabecera es un landmark único con ambos textos', async ({ openHome }) => {
    const home = await openHome();

    await expect(home.hud).toHaveCount(1);
    await expect(home.hud).toContainText('Nivel 0');
    await expect(home.hud).toContainText('El libro de recetas en blanco');
  });

  test('abrir el libro → el libro cubre la cocina → volver → el HUD sigue operable', async ({
    openHome,
    home,
    book,
  }) => {
    await openHome();
    await expect(home.levelBadge).toBeVisible();

    await home.station('Libro de recetas').click();
    await book.waitReady();
    await expect(book.root).toBeVisible();

    await book.back.click();
    await expect(book.root).toHaveCount(0);
    await expect(home.levelBadge).toBeVisible();
    await expect(home.station('Libro de recetas')).toBeEnabled();
  });
});
