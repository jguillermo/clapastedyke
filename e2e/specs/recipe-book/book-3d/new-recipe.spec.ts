import { test, expect } from '../../../fixtures/app-fixture';
import { SUPPLIES } from '../../../support/seed';

/**
 * Crear receta **desde el libro 3D**: en las páginas de categoría flota el botón primario
 * `＋ Nuevo «Categoría»`, que abre el mismo formulario único. Al guardar, el libro **recarga y salta
 * a la receta recién escrita**, así que el estado terminal es su contenido pintado como overlay
 * sobre la hoja.
 */
test.describe('Libro 3D · nueva receta', () => {
  test.use({ webgl: true });

  test('página de categoría → ＋ Nuevo → nombre + insumo → guardar → el libro salta a la receta nueva', async ({
    openBook3d,
    book,
    form,
    grid,
    overlay,
  }) => {
    await openBook3d();
    await book.goToFirstRecipe();

    await expect(book.newRecipe).toBeVisible();
    await book.newRecipe.click();
    await form.waitReady();
    await form.name.fill('Desde el libro 3D E2E');
    await grid.fillExistingLine(0, SUPPLIES.harina.name, '300');
    await form.save.click();
    await form.waitClosed();

    await expect(overlay.byName('Desde el libro 3D E2E')).toBeVisible();
  });

  test('página de categoría → ＋ Nuevo → el formulario trae fija la categoría de esa página', async ({
    openBook3d,
    book,
    form,
  }) => {
    await openBook3d();
    await book.goToFirstRecipe();
    const label = (await book.newRecipe.getAttribute('aria-label'))!;
    const category = label.replace('Nuevo ', '');

    await book.newRecipe.click();
    await form.waitReady();

    await expect(form.title).toHaveText('Nueva receta');
    await expect(form.subtitle).toHaveText(category);

    await form.cancel.click();
    await form.waitClosed();
    await expect(book.pager).toBeVisible();
  });

  test('＋ Nuevo → Cancelar → el libro se queda donde estaba, sin receta nueva', async ({
    openBook3d,
    book,
    form,
  }) => {
    await openBook3d();
    await book.goToFirstRecipe();
    const before = await book.announce.innerText();

    await book.newRecipe.click();
    await form.waitReady();
    await form.name.fill('Cancelada en el libro 3D E2E');
    await form.cancel.click();
    await form.waitClosed();

    await expect(book.announce).toHaveText(before);
    await expect(book.pager).toBeVisible();
  });

  test('formulario abierto sobre el libro → el teclado del libro no pagina', async ({
    openBook3d,
    book,
    form,
    page,
  }) => {
    await openBook3d();
    await book.goToFirstRecipe();
    const before = await book.announce.innerText();

    await book.newRecipe.click();
    await form.waitReady();
    // Con el diálogo abierto, las flechas son del formulario: el libro no debe voltear páginas.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(book.announce).toHaveText(before);

    await form.cancel.click();
    await form.waitClosed();
    await expect(book.announce).toHaveText(before);
  });

  test('portada → no hay botón de nueva receta (no es página de categoría) → avanzar → aparece', async ({
    openBook3d,
    book,
  }) => {
    const opened = await openBook3d();

    await expect(opened.announce).toHaveText('Portada');
    await expect(book.newRecipe).toHaveCount(0);

    await book.goToFirstRecipe();
    await expect(book.newRecipe).toBeVisible();
  });
});
