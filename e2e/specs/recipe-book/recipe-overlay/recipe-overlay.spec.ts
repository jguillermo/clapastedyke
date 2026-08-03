import { test, expect } from '../../../fixtures/app-fixture';
import { GLASEADO, SUPPLIES } from '../../../support/seed';

/**
 * Overlay de receta (`features/recipe-book/book-3d/recipe-overlay`): el DOM que se coloca
 * **encima** de la hoja del libro 3D. Título fijo (nombre + editar + badges) y cuerpo
 * scrolleable con las líneas de insumo, su contador y el total, que calcula el negocio
 * (`PreviewRecipeCost`).
 *
 * Dos journeys, un arranque cada uno: contenido y gesto, y edición. Dentro de un journey se
 * salta de receta **por el índice** (`jumpToRecipe`) porque pasar páginas solo avanza y la
 * segunda receta podría quedar por detrás.
 */
test.describe('Overlay de receta', () => {
  test.use({ webgl: true });

  test('avanzar hasta una receta → el overlay pinta nombre, líneas, contador y total → el vertical y el toque corto no paginan → deslizar avanza y retrocede → pasar de página lo retira', async ({
    openBook3d,
    book,
    overlay,
    page,
  }) => {
    await openBook3d();
    await book.goToRecipe(GLASEADO.name);

    const target = overlay.byName(GLASEADO.name);
    await expect(target).toBeVisible();
    await expect(overlay.linesOf(target)).toHaveCount(GLASEADO.lineCount);
    await expect(target).toContainText(`${GLASEADO.lineCount} insumos`);
    await expect(target).toContainText(GLASEADO.total);

    // Cada línea: insumo + cantidad + precio, ninguna celda vacía ni sin costear.
    const firstLine = overlay.linesOf(target).first();
    await expect(firstLine).toBeVisible();
    const cells = await overlay.cellsOf(firstLine).allInnerTexts();
    expect(cells).toHaveLength(3);
    for (const cell of cells) {
      expect(cell.trim()).not.toBe('');
    }
    expect(cells[2]).toContain('S/');

    // El título es un encabezado accesible y vive FUERA de la zona scrolleable.
    await expect(target.getByRole('heading', { level: 2 })).not.toBeEmpty();
    await expect(target.getByRole('button', { name: 'Editar receta' })).toBeVisible();
    await expect(overlay.scrollBodyOf(target).getByRole('heading', { level: 2 })).toHaveCount(0);

    // El cuerpo scrollea por dentro; la página del documento nunca se mueve.
    await expect(overlay.scrollBodyOf(target)).toBeVisible();
    if (await overlay.isScrollable(target)) {
      expect(await overlay.scrollToBottom(target)).toBeGreaterThan(0);
    }
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    // El deslizamiento vertical lo gestiona el scroll nativo: no debe paginar.
    const before = await book.announce.innerText();
    const box = (await overlay.at(0).boundingBox())!;
    const x = box.x + box.width / 2;
    await page.mouse.move(x, box.y + box.height * 0.7);
    await page.mouse.down();
    await page.mouse.move(x, box.y + box.height * 0.3, { steps: 10 });
    await page.mouse.up();
    await expect(book.announce).toHaveText(before);

    // Un toque corto (sin arrastrar) tampoco pagina.
    await overlay.at(0).click({ position: { x: 40, y: 120 } });
    await expect(book.announce).toHaveText(before);

    // El horizontal sí: avanza y vuelve.
    await overlay.swipe('next');
    await expect(overlay.byName(GLASEADO.name)).toHaveCount(0);
    await overlay.swipe('prev');
    await expect(overlay.byName(GLASEADO.name)).toBeVisible();

    // Estado terminal: al pasar de página el overlay de la receta anterior se retira.
    await book.goNext();
    await expect(overlay.byName(GLASEADO.name)).toHaveCount(0);
  });

  test('tecla E en la portada no abre nada → lápiz del overlay → añadir una línea → guardar → recuenta insumos y total → renombrar → el overlay muestra el nombre nuevo → badges y tecla E en otras recetas', async ({
    openBook3d,
    book,
    overlay,
    form,
    grid,
    page,
  }) => {
    await openBook3d();

    // En la portada no hay receta que editar.
    await expect(book.announce).toHaveText('Portada');
    await page.keyboard.press('e');
    await expect(form.root).toHaveCount(0);
    await expect(book.pager).toBeVisible();

    await book.goToRecipe(GLASEADO.name);
    await expect(overlay.byName(GLASEADO.name)).toContainText(`${GLASEADO.lineCount} insumos`);

    // El lápiz abre el formulario único de esa receta, precargado.
    await overlay.byName(GLASEADO.name).getByRole('button', { name: 'Editar receta' }).click();
    await form.waitReady();
    await expect(form.name).toHaveValue(GLASEADO.name);
    await expect(form.subtitle).toHaveText(GLASEADO.category);

    // Al guardar, el libro recarga y salta a la receta editada, ya recontada.
    await grid.fillExistingLine(GLASEADO.lineCount, SUPPLIES.huevos.name, '2');
    await form.save.click();
    await form.waitClosed();
    const conLineaNueva = overlay.byName(GLASEADO.name);
    await expect(conLineaNueva).toContainText(`${GLASEADO.lineCount + 1} insumos`);
    await expect(conLineaNueva).not.toContainText(GLASEADO.total);

    // Renombrar desde el overlay.
    await overlay.byName(GLASEADO.name).getByRole('button', { name: 'Editar receta' }).click();
    await form.waitReady();
    await form.name.fill('Glaseado renombrado en el libro E2E');
    await form.save.click();
    await form.waitClosed();
    await expect(overlay.byName('Glaseado renombrado en el libro E2E')).toBeVisible();
    await expect(overlay.byName(GLASEADO.name)).toHaveCount(0);

    // Una receta sin características no pinta badges hasta que se le ponen.
    await book.jumpToRecipe('Keke de Chocolate');
    const kekeOverlay = overlay.byName('Keke de Chocolate');
    await expect(overlay.badgesOf(kekeOverlay)).toHaveCount(0);
    await kekeOverlay.getByRole('button', { name: 'Editar receta' }).click();
    await form.waitReady();
    await form.properties.pick('Sabor', 'Chocolate');
    await form.properties.pick('Porciones', '24');
    await form.save.click();
    await form.waitClosed();
    const keke = overlay.byName('Keke de Chocolate');
    await expect(overlay.badgesOf(keke)).toHaveCount(2);
    await expect(keke).toContainText('Sabor: Chocolate');
    await expect(keke).toContainText('Porciones: 24');

    /*
     * La tecla **E** edita `currentRecipe()`, que es la receta de la página **derecha con
     * prioridad** (en escritorio el spread muestra dos recetas; en móvil solo hay una). Por eso
     * se lee el título del último overlay del spread y se espera ese nombre en el formulario.
     */
    await book.jumpToRecipe('Crema Pastelera');
    const before = await book.announce.innerText();
    const titles = await overlay.titles();
    const current = titles[titles.length - 1];

    await page.keyboard.press('e');
    await form.waitReady();
    await expect(form.name).toHaveValue(current);

    // Estado terminal: se descarta y el libro se queda en la misma página.
    await form.cancel.click();
    await form.waitClosed();
    await expect(book.announce).toHaveText(before);
    await expect(overlay.byName(current)).toBeVisible();
  });
});
