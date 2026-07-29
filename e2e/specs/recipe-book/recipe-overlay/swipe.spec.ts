import { test, expect } from '../../../fixtures/app-fixture';
import { GLASEADO } from '../../../support/seed';

/**
 * Gesto sobre el overlay: como el overlay tapa la hoja, es él quien capta el deslizamiento y lo
 * reemite al libro (`swipe`). El horizontal pasa página; el vertical lo maneja el scroll nativo del
 * cuerpo, así que **no** debe paginar.
 */
test.describe('Overlay de receta · deslizar para pasar página', () => {
  test.use({ webgl: true });

  test('deslizar hacia la izquierda sobre el overlay → avanza de página', async ({
    openBook3d,
    book,
    overlay,
  }) => {
    await openBook3d();
    await book.goToFirstRecipe();
    const before = await book.announce.innerText();

    await overlay.swipe('next');

    await expect(book.announce).not.toHaveText(before);
  });

  test('deslizar a la izquierda y luego a la derecha → vuelve a la receta de partida', async ({
    openBook3d,
    book,
    overlay,
  }) => {
    await openBook3d();
    await book.goToRecipe(GLASEADO.name);
    await expect(overlay.byName(GLASEADO.name)).toBeVisible();

    await overlay.swipe('next');
    await expect(overlay.byName(GLASEADO.name)).toHaveCount(0);

    await overlay.swipe('prev');
    await expect(overlay.byName(GLASEADO.name)).toBeVisible();
  });

  test('deslizamiento vertical sobre el overlay → no pasa página (lo gestiona el scroll nativo)', async ({
    openBook3d,
    book,
    overlay,
    page,
  }) => {
    await openBook3d();
    await book.goToFirstRecipe();
    const before = await book.announce.innerText();

    const box = (await overlay.at(0).boundingBox())!;
    const x = box.x + box.width / 2;
    await page.mouse.move(x, box.y + box.height * 0.7);
    await page.mouse.down();
    await page.mouse.move(x, box.y + box.height * 0.3, { steps: 10 });
    await page.mouse.up();

    await expect(book.announce).toHaveText(before);
  });

  test('toque corto sobre el overlay (sin arrastrar) → no pasa página', async ({
    openBook3d,
    book,
    overlay,
  }) => {
    await openBook3d();
    await book.goToFirstRecipe();
    const before = await book.announce.innerText();

    await overlay.at(0).click({ position: { x: 40, y: 120 } });

    await expect(book.announce).toHaveText(before);
  });
});
