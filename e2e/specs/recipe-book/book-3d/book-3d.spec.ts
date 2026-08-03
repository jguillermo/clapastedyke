import { test, expect } from '../../../fixtures/app-fixture';
import { CATEGORIES, GLASEADO, RECIPES, SUPPLIES, SUPPLY_COUNT } from '../../../support/seed';

/**
 * Libro en su **modo 3D** (`features/recipe-book/book-3d` con WebGL). El contenido de la hoja
 * lo pinta three.js, así que **el único texto accesible de lo que se ve es la región
 * `aria-live`** (`book.announce`): contra ella se sincroniza y se asserta, nunca contra el canvas.
 *
 * Tres journeys, un arranque cada uno — y el arranque aquí es el caro, porque monta el motor:
 * paginación por todos sus medios, panel de índice, y las acciones flotantes de la hoja
 * (nueva receta y gestión de insumos).
 */
test.describe('Libro 3D', () => {
  test.use({ webgl: true });

  test('portada → avanzar y retroceder con la barra, el teclado, el gesto y el clic sobre el canvas → End y Home → hasta la primera receta → Volver → vuelve la cocina', async ({
    openBook3d,
    book,
    overlay,
    home,
    page,
  }) => {
    await openBook3d();

    // El libro abre en la portada: solo se puede avanzar.
    await expect(book.announce).toHaveText('Portada');
    await expect(book.prev).toBeDisabled();
    await expect(book.next).toBeEnabled();
    // El canvas queda oculto a lectores de pantalla; el contenido se anuncia por aria-live.
    await expect(book.canvas).toHaveAttribute('aria-hidden', 'true');
    await expect(book.announce).toHaveAttribute('aria-live', 'polite');

    // Barra de páginas.
    await book.goNext();
    await expect(book.announce).not.toBeEmpty();
    await expect(book.prev).toBeEnabled();
    await book.goPrev();
    await expect(book.announce).toHaveText('Portada');
    await expect(book.prev).toBeDisabled();

    // Teclado: flechas y páginas.
    await page.keyboard.press('ArrowRight');
    await expect(book.announce).not.toHaveText('Portada');
    await page.keyboard.press('ArrowLeft');
    await expect(book.announce).toHaveText('Portada');

    await page.keyboard.press('PageDown');
    await expect(book.announce).not.toHaveText('Portada');
    await page.keyboard.press('PageUp');
    await expect(book.announce).toHaveText('Portada');

    // Gesto sobre el canvas: deslizar hacia la izquierda avanza.
    const box = (await book.canvas.boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.8, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8 - 200, y, { steps: 10 });
    await page.mouse.up();
    await expect(book.announce).not.toHaveText('Portada');

    // Clic en cada mitad del canvas: la derecha avanza, la izquierda retrocede.
    await book.canvas.click({ position: { x: box.width * 0.2, y: box.height / 2 } });
    await expect(book.announce).toHaveText('Portada');
    await book.canvas.click({ position: { x: box.width * 0.8, y: box.height / 2 } });
    await expect(book.announce).not.toHaveText('Portada');

    // Extremos.
    await page.keyboard.press('End');
    await expect(book.next).toBeDisabled();
    await expect(book.prev).toBeEnabled();
    await page.keyboard.press('Home');
    await expect(book.announce).toHaveText('Portada');
    await expect(book.prev).toBeDisabled();

    // Hasta una receta: su contenido se pinta como overlay DOM sobre la hoja.
    await book.goToFirstRecipe();
    await expect(overlay.title(0)).not.toBeEmpty();

    // Estado terminal: el libro se desmonta y vuelve la cocina.
    await book.back.click();
    await expect(book.root).toHaveCount(0);
    await expect(home.dock).toBeVisible();
  });

  test('Índice → cada categoría con todas sus recetas y ningún insumo → saltar a una receta → cerrar con ×, con el botón y con Escape → Escape otra vez cierra el libro', async ({
    openBook3d,
    book,
    overlay,
    home,
    page,
  }) => {
    await openBook3d();
    /** Todas las recetas sembradas, en el orden en que las lista el índice. */
    const allRecipes = CATEGORIES.flatMap((category) => RECIPES[category]);

    await book.indexToggle.click();
    await expect(book.indexPanel).toBeVisible();
    for (const category of CATEGORIES) {
      await expect(book.indexSection(category)).toBeVisible();
    }
    // Un salto por receta del catálogo, ni uno más: los insumos no son recetas y no se listan.
    await expect(book.indexRecipes).toHaveCount(allRecipes.length);
    /*
     * Se cuenta cada nombre, no solo que «esté». Hay recetas homónimas en categorías distintas
     * («Crema Chantilly» y «Ganache de Chocolate» están en Rellenos y en Coberturas): con una
     * aserción de visibilidad, si el índice se dejara una de las dos, el test seguiría pasando
     * porque la otra la satisface. Contando, no.
     */
    const expectedPerName = new Map<string, number>();
    for (const recipe of allRecipes) {
      expectedPerName.set(recipe, (expectedPerName.get(recipe) ?? 0) + 1);
    }
    for (const [recipe, times] of expectedPerName) {
      await expect(book.indexRecipe(recipe)).toHaveCount(times);
    }
    await expect(book.indexSection('Insumos')).toHaveCount(0);

    // El cierre es enfocable por teclado y cumple el target táctil.
    await book.indexClose.focus();
    await expect(book.indexClose).toBeFocused();
    expect((await book.indexToggle.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await book.indexClose.press('Enter');
    await expect(book.indexPanel).toHaveCount(0);
    await expect(book.pager).toBeVisible();
    await expect(book.next).toBeEnabled();

    // Elegir una receta cierra el panel y salta a su página.
    await book.indexToggle.click();
    await expect(book.indexPanel).toBeVisible();
    await book.indexRecipe(GLASEADO.name).click(); // nombre único: una sola entrada
    await expect(book.indexPanel).toHaveCount(0);
    await expect(overlay.byName(GLASEADO.name).first()).toBeVisible();

    // Abrirlo y cerrarlo con la × sobre una receta la deja a la vista.
    const title = await overlay.title(0).innerText();
    await book.indexToggle.click();
    await expect(book.indexPanel).toBeVisible();
    await book.indexClose.click();
    await expect(book.indexPanel).toHaveCount(0);
    await expect(overlay.title(0)).toHaveText(title);

    // El mismo botón otra vez lo cierra sin navegar.
    const before = await book.announce.innerText();
    await book.indexToggle.click();
    await expect(book.indexPanel).toBeVisible();
    await book.indexToggle.click();
    await expect(book.indexPanel).toHaveCount(0);
    await expect(book.announce).toHaveText(before);

    // Escape cierra SOLO el índice: el libro sigue abierto y paginable.
    await book.indexToggle.click();
    await expect(book.indexPanel).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(book.indexPanel).toHaveCount(0);
    await expect(book.canvas).toBeVisible();
    await book.goNext();

    // Estado terminal: sin índice abierto, Escape cierra el libro.
    await page.keyboard.press('Escape');
    await expect(book.root).toHaveCount(0);
    await expect(home.dock).toBeVisible();
  });

  test('página de categoría → ＋ Nuevo con su categoría fija → Cancelar deja el libro donde estaba → guardar salta a la receta nueva → sección de Insumos → Gestionar insumos → alta persistida', async ({
    openBook3d,
    book,
    form,
    grid,
    overlay,
    supplies,
    page,
  }) => {
    await openBook3d();

    // La portada no es página de categoría: no hay botón de nueva receta.
    await expect(book.announce).toHaveText('Portada');
    await expect(book.newRecipe).toHaveCount(0);

    await book.goToFirstRecipe();
    await expect(book.newRecipe).toBeVisible();
    const label = (await book.newRecipe.getAttribute('aria-label'))!;
    const category = label.replace('Nuevo ', '');
    const before = await book.announce.innerText();

    // El formulario hereda la categoría de la página desde la que se abre.
    await book.newRecipe.click();
    await form.waitReady();
    await expect(form.title).toHaveText('Nueva receta');
    await expect(form.subtitle).toHaveText(category);

    // Con el diálogo abierto, las flechas son del formulario: el libro no debe voltear páginas.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(book.announce).toHaveText(before);

    // Cancelar deja el libro exactamente donde estaba, sin receta nueva.
    await form.name.fill('Cancelada en el libro 3D E2E');
    await form.cancel.click();
    await form.waitClosed();
    await expect(book.announce).toHaveText(before);
    await expect(book.pager).toBeVisible();

    // Al guardar, el libro recarga y salta a la receta recién escrita.
    await book.newRecipe.click();
    await form.waitReady();
    await form.name.fill('Desde el libro 3D E2E');
    await grid.fillExistingLine(0, SUPPLIES.harina.name, '300');
    await form.save.click();
    await form.waitClosed();
    await expect(overlay.byName('Desde el libro 3D E2E')).toBeVisible();

    // En la sección de Insumos el botón flotante cambia de acción.
    await book.goToSuppliesSection();
    await expect(book.manageSupplies).toBeVisible();
    await expect(book.newRecipe).toHaveCount(0);

    await book.manageSupplies.click();
    await supplies.waitReady();
    await expect(supplies.list.rows).toHaveCount(SUPPLY_COUNT + 1);
    await supplies.list.addSupply('Grageas de color E2E', '80', '6');
    await supplies.close.click();
    await supplies.waitClosed();
    await expect(book.pager).toBeVisible();

    // Estado terminal: el libro recargó el catálogo y el insumo sigue ahí al reabrir.
    await expect(book.manageSupplies).toBeVisible();
    await book.manageSupplies.click();
    await supplies.waitReady();
    expect(await supplies.list.names()).toContain('Grageas de color E2E');
    await supplies.close.click();
    await supplies.waitClosed();
  });
});
