import { test, expect } from '../../../fixtures/app-fixture';

/**
 * Regla dura **mobile-first** sobre el libro 3D a **375px**: el motor pasa a modo **single**
 * (una sola cara, así que un único overlay de receta), la barra de páginas va a ancho completo
 * con targets ≥ 44px, el índice es full-bleed y el deslizamiento pasa página.
 *
 * Un solo journey, porque montar el motor 3D es lo caro: se mide la vista y se recorre entera al
 * toque hasta volver a la cocina.
 */
test.describe('Libro 3D · móvil 375px', () => {
  test.use({ webgl: true });

  test('libro a 375px → barra táctil que cabe y nada desborda → tocar siguiente y anterior → índice full-bleed → una sola cara con su overlay → deslizar pasa página → Volver → vuelve la cocina', async ({
    openBook3d,
    book,
    overlay,
    home,
    page,
  }) => {
    await openBook3d();
    const viewport = page.viewportSize()!;

    const pager = (await book.pager.boundingBox())!;
    expect(pager.x).toBeGreaterThanOrEqual(0);
    expect(pager.x + pager.width).toBeLessThanOrEqual(viewport.width + 1);

    for (const [label, locator] of [
      ['Página anterior', book.prev],
      ['Índice', book.indexToggle],
      ['Página siguiente', book.next],
    ] as const) {
      const box = (await locator.boundingBox())!;
      expect(box.height, `${label} debe cumplir el target táctil`).toBeGreaterThanOrEqual(44);
    }

    const [scrollWidth, innerWidth] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      window.innerWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);

    // Paginación al toque.
    await book.next.tap();
    await expect(book.announce).not.toHaveText('Portada');
    await book.prev.tap();
    await expect(book.announce).toHaveText('Portada');

    // Índice full-bleed en móvil (en `sm+` es una columna de 320px).
    await book.indexToggle.tap();
    await expect(book.indexPanel).toBeVisible();
    const panel = (await book.indexPanel.boundingBox())!;
    expect(panel.x).toBe(0);
    expect(panel.width).toBeCloseTo(viewport.width, 0);
    await book.indexClose.tap();
    await expect(book.indexPanel).toHaveCount(0);

    // Modo single: nunca hay spread de dos páginas en móvil.
    await book.goToFirstRecipe();
    await expect(overlay.all).toHaveCount(1);

    // Deslizar sobre el overlay pasa página.
    const before = await book.announce.innerText();
    await overlay.swipe('next');
    await expect(book.announce).not.toHaveText(before);

    // Estado terminal: el libro se desmonta y queda la cocina.
    await book.back.tap();
    await expect(book.root).toHaveCount(0);
    await expect(home.dock).toBeVisible();
  });
});
