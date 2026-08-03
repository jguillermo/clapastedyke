import { test, expect } from '../../../fixtures/app-fixture';

/**
 * Regla dura mobile-first verificada a **375px** sobre la cocina: nada desborda en horizontal,
 * el dock cabe con targets ≥ 44px, el viewport bloquea el zoom (excepción aceptada de AXE) y el
 * flujo completo se opera al toque.
 *
 * Un solo journey: se mide la vista y, sin volver a arrancar, se entra al libro y se vuelve.
 */
test.describe('Cocina · móvil 375px', () => {
  test.use({ webgl: true });

  test('cocina a 375px → sin desbordamiento, dock táctil y zoom bloqueado → toque en la estación abre el libro → Volver → vuelve la cocina', async ({
    openHome,
    home,
    book,
    page,
  }) => {
    await openHome();

    const [scrollWidth, innerWidth] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      window.innerWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);

    const viewportMeta = await home.viewportContent();
    expect(viewportMeta).toContain('user-scalable=no');
    expect(viewportMeta).toContain('maximum-scale=1');

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

    await home.station('Libro de recetas').tap();
    await book.waitReady();
    await expect(book.pager).toBeVisible();

    await book.back.tap();
    await expect(book.root).toHaveCount(0);
    await expect(home.dock).toBeVisible();
  });
});
