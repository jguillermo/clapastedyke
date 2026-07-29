import { test, expect } from '../../../fixtures/app-fixture';

/**
 * Regla dura **mobile-first** sobre el libro 3D a **375px**: el motor pasa a modo **single** (una
 * sola cara, así que un único overlay de receta), la barra de páginas va pegada al footer a ancho
 * completo con targets ≥ 44px, y el deslizamiento pasa página.
 */
test.describe('Libro 3D · móvil 375px', () => {
  test.use({ webgl: true });

  test('libro abierto a 375px → una sola cara visible → un único overlay de receta', async ({
    openBook3d,
    book,
    overlay,
  }) => {
    await openBook3d();

    await book.goToFirstRecipe();

    // Modo single: nunca hay spread de dos páginas en móvil.
    await expect(overlay.all).toHaveCount(1);
  });

  test('barra de páginas a 375px → cabe en el viewport y sus botones cumplen el target táctil', async ({
    openBook3d,
    book,
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
  });

  test('libro a 375px → nada desborda en horizontal', async ({ openBook3d, page }) => {
    await openBook3d();

    const [scrollWidth, innerWidth] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      window.innerWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });

  test('toque en Página siguiente a 375px → avanza → toque en Página anterior → vuelve la portada', async ({
    openBook3d,
    book,
  }) => {
    await openBook3d();

    await book.next.tap();
    await expect(book.announce).not.toHaveText('Portada');

    await book.prev.tap();
    await expect(book.announce).toHaveText('Portada');
  });

  test('índice a 375px → panel full-bleed → × → se cierra y el libro sigue paginable', async ({
    openBook3d,
    book,
    page,
  }) => {
    await openBook3d();
    const viewport = page.viewportSize()!;

    await book.indexToggle.tap();
    await expect(book.indexPanel).toBeVisible();
    // Full-bleed en móvil: el panel ocupa todo el ancho (en `sm+` es una columna de 320px).
    const panel = (await book.indexPanel.boundingBox())!;
    expect(panel.x).toBe(0);
    expect(panel.width).toBeCloseTo(viewport.width, 0);

    await book.indexClose.tap();

    await expect(book.indexPanel).toHaveCount(0);
    await book.next.tap();
    await expect(book.announce).not.toHaveText('Portada');
  });

  test('deslizar sobre el overlay a 375px → pasa página → Volver → vuelve la cocina', async ({
    openBook3d,
    book,
    overlay,
    home,
  }) => {
    await openBook3d();
    await book.goToFirstRecipe();
    const before = await book.announce.innerText();

    await overlay.swipe('next');
    await expect(book.announce).not.toHaveText(before);

    await book.back.tap();
    await expect(book.root).toHaveCount(0);
    await expect(home.dock).toBeVisible();
  });
});
