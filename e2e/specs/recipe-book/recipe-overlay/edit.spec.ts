import { test, expect } from '../../../fixtures/app-fixture';
import { GLASEADO, SUPPLIES } from '../../../support/seed';

/**
 * Editar desde el overlay: el lápiz de la cabecera abre el formulario único de esa receta, y la
 * tecla **E** hace lo mismo con la receta de la página actual (atajo de accesibilidad, porque el chip
 * 3D no es focusable).
 *
 * Al guardar, el libro recarga y salta a la receta editada: el estado terminal es su overlay con el
 * cambio ya pintado.
 */
test.describe('Overlay de receta · editar', () => {
  test.use({ webgl: true });

  test('lápiz del overlay → formulario precargado → renombrar → guardar → el overlay muestra el nombre nuevo', async ({
    openBook3d,
    book,
    overlay,
    form,
  }) => {
    await openBook3d();
    await book.goToRecipe(GLASEADO.name);

    await overlay.byName(GLASEADO.name).getByRole('button', { name: 'Editar receta' }).click();
    await form.waitReady();
    await expect(form.name).toHaveValue(GLASEADO.name);
    await expect(form.subtitle).toHaveText(GLASEADO.category);

    await form.name.fill('Glaseado renombrado en el libro E2E');
    await form.save.click();
    await form.waitClosed();

    await expect(overlay.byName('Glaseado renombrado en el libro E2E')).toBeVisible();
    await expect(overlay.byName(GLASEADO.name)).toHaveCount(0);
  });

  /**
   * La tecla **E** edita `currentRecipe()`, que es la receta de la página **derecha con prioridad**
   * (en escritorio el spread muestra dos recetas; en móvil solo hay una). Por eso el test lee el
   * título del último overlay del spread y espera ese nombre en el formulario.
   */
  test('tecla E en una página de receta → abre el formulario de la hoja derecha → Cancelar → el libro sigue en la misma página', async ({
    openBook3d,
    book,
    overlay,
    form,
    page,
  }) => {
    await openBook3d();
    await book.goToRecipe('Crema Pastelera');
    const before = await book.announce.innerText();
    const titles = await overlay.titles();
    const current = titles[titles.length - 1];

    await page.keyboard.press('e');
    await form.waitReady();
    await expect(form.name).toHaveValue(current);

    await form.cancel.click();
    await form.waitClosed();
    await expect(book.announce).toHaveText(before);
    await expect(overlay.byName(current)).toBeVisible();
  });

  test('tecla E en la portada → no abre nada (no hay receta en la página)', async ({
    openBook3d,
    form,
    page,
  }) => {
    const book = await openBook3d();
    await expect(book.announce).toHaveText('Portada');

    await page.keyboard.press('e');

    await expect(form.root).toHaveCount(0);
    await expect(book.pager).toBeVisible();
  });

  test('editar desde el overlay → añadir una línea → guardar → el overlay recuenta insumos y total', async ({
    openBook3d,
    book,
    overlay,
    form,
    grid,
  }) => {
    await openBook3d();
    await book.goToRecipe(GLASEADO.name);
    const target = overlay.byName(GLASEADO.name);
    await expect(target).toContainText(`${GLASEADO.lineCount} insumos`);

    await target.getByRole('button', { name: 'Editar receta' }).click();
    await form.waitReady();
    // El seed trae `lineCount` líneas; la siguiente fila libre es el renglón vacío final.
    await grid.fillExistingLine(GLASEADO.lineCount, SUPPLIES.huevos.name, '2');
    await form.save.click();
    await form.waitClosed();

    const updated = overlay.byName(GLASEADO.name);
    await expect(updated).toContainText(`${GLASEADO.lineCount + 1} insumos`);
    await expect(updated).not.toContainText(GLASEADO.total);
  });

  test('editar desde el overlay → Escape → vuelve la cocina → reabrir el libro → nada cambió', async ({
    openBook3d,
    book,
    home,
    form,
    overlay,
    page,
  }) => {
    await openBook3d();
    await book.goToRecipe('Manjar Blanco');

    await page.keyboard.press('e');
    await form.waitReady();
    await form.name.fill('Descartado con Escape en el libro E2E');
    // Escape cierra el diálogo y, en el mismo evento, también el libro (guarda `dialogOpen` ya
    // liberada) — el invariante que importa es que no se guardó nada.
    await page.keyboard.press('Escape');
    await form.waitClosed();

    await expect(home.dock).toBeVisible();
    await home.station('Libro de recetas').click();
    await book.waitReady();
    await book.goToRecipe('Manjar Blanco');
    await expect(overlay.byName('Manjar Blanco')).toBeVisible();
    await expect(overlay.byName('Descartado con Escape en el libro E2E')).toHaveCount(0);
  });
});
