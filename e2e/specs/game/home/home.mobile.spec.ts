import { test, expect } from '../../../fixtures/app-fixture';

/**
 * Regla dura mobile-first verificada a **375px** sobre la vista de la cocina: nada
 * desborda en horizontal, el dock cabe y todo target táctil mide ≥ 44px.
 */
test.describe('Home 3D · móvil 375px', () => {
  test.use({ webgl: true });

  test('mundo cargado a 375px → no hay desbordamiento horizontal', async ({ openHome, page }) => {
    await openHome();

    const [scrollWidth, innerWidth] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      window.innerWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });

  test('dock a 375px → cabe en el viewport y sus targets miden ≥ 44px', async ({ openHome, home, page }) => {
    await openHome();
    await expect(home.dock).toBeVisible();

    const viewport = page.viewportSize()!;
    const dock = (await home.dock.boundingBox())!;
    expect(dock.x).toBeGreaterThanOrEqual(0);
    expect(dock.x + dock.width).toBeLessThanOrEqual(viewport.width + 1);

    const count = await home.stations.count();
    for (let i = 0; i < count; i++) {
      const box = (await home.stations.nth(i).boundingBox())!;
      expect(box.height, `estación ${i} debe cumplir el target táctil`).toBeGreaterThanOrEqual(44);
    }
  });

  test('viewport bloqueado → sin zoom del usuario (excepción aceptada de AXE)', async ({ page, openHome }) => {
    await openHome();

    const viewportMeta = await page
      .locator('meta[name="viewport"]')
      .getAttribute('content');
    expect(viewportMeta).toContain('user-scalable=no');
    expect(viewportMeta).toContain('maximum-scale=1');
  });

  test('toque en la estación a 375px → se abre el libro → Volver → vuelve la cocina', async ({
    openHome,
    home,
    book,
  }) => {
    await openHome();

    await home.station('Libro de recetas').tap();
    await book.waitReady();
    await expect(book.pager).toBeVisible();

    await book.back.tap();
    await expect(book.root).toHaveCount(0);
    await expect(home.dock).toBeVisible();
  });
});
