import { test, expect } from '../../../fixtures/app-fixture';

/**
 * Paginación del libro en su **modo 3D** (`features/recipe-book/book-3d` con WebGL): la barra
 * inferior, el teclado y el gesto sobre el canvas.
 *
 * El contenido de la hoja se pinta con three.js, así que **el único texto accesible de lo que se ve
 * es la región `aria-live`** (`book.announce`): contra ella se sincroniza y se asserta, nunca contra
 * el canvas. Cada test acaba en un estado asentado del libro (spread nuevo estable) o de vuelta en
 * la cocina.
 */
test.describe('Libro 3D · paginación', () => {
  test.use({ webgl: true });

  test('libro recién abierto → está en la portada y solo se puede avanzar', async ({ openBook3d }) => {
    const book = await openBook3d();

    await expect(book.announce).toHaveText('Portada');
    await expect(book.prev).toBeDisabled();
    await expect(book.next).toBeEnabled();
  });

  test('portada → Página siguiente → el spread cambia → Página anterior → vuelve la portada', async ({
    openBook3d,
  }) => {
    const book = await openBook3d();

    await book.goNext();
    await expect(book.announce).not.toHaveText('Portada');
    await expect(book.prev).toBeEnabled();

    await book.goPrev();
    await expect(book.announce).toHaveText('Portada');
    await expect(book.prev).toBeDisabled();
  });

  test('flecha derecha del teclado → avanza; flecha izquierda → retrocede a la portada', async ({
    openBook3d,
    page,
  }) => {
    const book = await openBook3d();

    await page.keyboard.press('ArrowRight');
    await expect(book.announce).not.toHaveText('Portada');

    await page.keyboard.press('ArrowLeft');
    await expect(book.announce).toHaveText('Portada');
  });

  test('PageDown → avanza; PageUp → retrocede a la portada', async ({ openBook3d, page }) => {
    const book = await openBook3d();

    await page.keyboard.press('PageDown');
    await expect(book.announce).not.toHaveText('Portada');

    await page.keyboard.press('PageUp');
    await expect(book.announce).toHaveText('Portada');
  });

  test('End → última página (no se puede avanzar más) → Home → vuelve la portada', async ({
    openBook3d,
    page,
  }) => {
    const book = await openBook3d();

    await page.keyboard.press('End');
    await expect(book.next).toBeDisabled();
    await expect(book.prev).toBeEnabled();

    await page.keyboard.press('Home');
    await expect(book.announce).toHaveText('Portada');
    await expect(book.prev).toBeDisabled();
  });

  test('avanzar hasta la primera receta → su contenido se pinta como overlay → Volver → vuelve la cocina', async ({
    openBook3d,
    book,
    home,
    overlay,
  }) => {
    await openBook3d();

    await book.goToFirstRecipe();
    await expect(overlay.title(0)).not.toBeEmpty();

    await book.back.click();
    await expect(book.root).toHaveCount(0);
    await expect(home.dock).toBeVisible();
  });

  test('deslizar sobre el canvas hacia la izquierda → avanza de página', async ({
    openBook3d,
    page,
  }) => {
    const book = await openBook3d();
    const box = (await book.canvas.boundingBox())!;
    const y = box.y + box.height / 2;

    await page.mouse.move(box.x + box.width * 0.8, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8 - 200, y, { steps: 10 });
    await page.mouse.up();

    await expect(book.announce).not.toHaveText('Portada');
  });

  test('clic en la mitad derecha del canvas → avanza; clic en la izquierda → retrocede', async ({
    openBook3d,
  }) => {
    const book = await openBook3d();
    const box = (await book.canvas.boundingBox())!;

    await book.canvas.click({ position: { x: box.width * 0.8, y: box.height / 2 } });
    await expect(book.announce).not.toHaveText('Portada');

    await book.canvas.click({ position: { x: box.width * 0.2, y: box.height / 2 } });
    await expect(book.announce).toHaveText('Portada');
  });

  test('el canvas queda oculto a lectores de pantalla y el contenido se anuncia por aria-live', async ({
    openBook3d,
  }) => {
    const book = await openBook3d();

    await expect(book.canvas).toHaveAttribute('aria-hidden', 'true');
    await expect(book.announce).toHaveAttribute('aria-live', 'polite');
    await book.goNext();
    await expect(book.announce).not.toBeEmpty();
  });
});
