import { test, expect } from '../../../fixtures/app-fixture';
import { GLASEADO } from '../../../support/seed';

/**
 * Contenido del overlay de receta (`features/recipe-book/book-3d/recipe-overlay`): el DOM que se
 * coloca **encima** de la hoja del libro 3D. Título fijo (nombre + editar + badges) y cuerpo
 * scrolleable con las líneas de insumo, su contador y el total.
 *
 * El total lo calcula el negocio (`PreviewRecipeCost`) y la vista solo lo pinta: los importes
 * esperados salen del seed.
 */
test.describe('Overlay de receta · contenido', () => {
  test.use({ webgl: true });

  test('avanzar hasta una receta → el overlay pinta su nombre, sus líneas y el total del negocio', async ({
    openBook3d,
    book,
    overlay,
  }) => {
    await openBook3d();

    await book.goToRecipe(GLASEADO.name);

    const target = overlay.byName(GLASEADO.name);
    await expect(target).toBeVisible();
    await expect(overlay.linesOf(target)).toHaveCount(GLASEADO.lineCount);
    await expect(target).toContainText(`${GLASEADO.lineCount} insumos`);
    await expect(target).toContainText(GLASEADO.total);
  });

  test('overlay de una receta → cada línea muestra insumo, cantidad y precio', async ({
    openBook3d,
    book,
    overlay,
  }) => {
    await openBook3d();

    await book.goToRecipe(GLASEADO.name);
    const firstLine = overlay.linesOf(overlay.byName(GLASEADO.name)).first();

    await expect(firstLine).toBeVisible();
    // Insumo + cantidad + precio: tres celdas, ninguna vacía ni sin costear («—»).
    const cells = await overlay.cellsOf(firstLine).allInnerTexts();
    expect(cells).toHaveLength(3);
    for (const cell of cells) {
      expect(cell.trim()).not.toBe('');
    }
    expect(cells[2]).toContain('S/');
  });

  test('el título del overlay es un encabezado accesible y queda fuera de la zona scrolleable', async ({
    openBook3d,
    book,
    overlay,
  }) => {
    await openBook3d();
    await book.goToFirstRecipe();

    await expect(overlay.title(0)).not.toBeEmpty();
    await expect(overlay.editButton(0)).toBeVisible();
    // El cuerpo scrolleable es un hermano del título: el título no vive dentro de él.
    await expect(overlay.scrollBody(0).getByRole('heading', { level: 2 })).toHaveCount(0);
  });

  test('receta sin características → el overlay no pinta badges → añadir sabor → los pinta', async ({
    openBook3d,
    book,
    overlay,
    form,
  }) => {
    await openBook3d();
    await book.goToRecipe('Keke de Chocolate');
    const target = overlay.byName('Keke de Chocolate');
    await expect(overlay.badgesOf(target)).toHaveCount(0);

    await target.getByRole('button', { name: 'Editar receta' }).click();
    await form.waitReady();
    await form.flavor.pick('Sabor', 'Chocolate');
    await form.size.pick('Porciones', '24');
    await form.save.click();
    await form.waitClosed();

    const updated = overlay.byName('Keke de Chocolate');
    await expect(overlay.badgesOf(updated)).toHaveCount(2);
    await expect(updated).toContainText('Sabor: Chocolate');
    await expect(updated).toContainText('Porciones: 24');
  });

  test('cuerpo largo → se puede scrollear dentro del overlay sin mover la página', async ({
    openBook3d,
    book,
    overlay,
    page,
  }) => {
    await openBook3d();
    await book.goToRecipe(GLASEADO.name);
    const target = overlay.byName(GLASEADO.name);
    await expect(overlay.scrollBodyOf(target)).toBeVisible();

    if (await overlay.isScrollable(target)) {
      expect(await overlay.scrollToBottom(target)).toBeGreaterThan(0);
    }
    // La página del documento nunca scrollea: el libro es una vista fija a pantalla completa.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('pasar de página → el overlay de la receta anterior se retira', async ({
    openBook3d,
    book,
    overlay,
  }) => {
    await openBook3d();
    await book.goToRecipe(GLASEADO.name);
    await expect(overlay.byName(GLASEADO.name)).toBeVisible();

    await book.goNext();

    await expect(overlay.byName(GLASEADO.name)).toHaveCount(0);
  });
});
