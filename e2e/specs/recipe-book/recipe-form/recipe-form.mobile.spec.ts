import { test, expect } from '../../../fixtures/app-fixture';
import { GLASEADO, SUPPLIES } from '../../../support/seed';

/**
 * Regla dura **mobile-first** sobre el formulario de receta, verificada a **375px**: el diálogo
 * es full-bleed, **solo el cuerpo scrollea** con cabecera y pie fijos, nada desborda en
 * horizontal, la grilla no aplasta la vista y los targets táctiles miden ≥ 44px.
 *
 * Un solo journey: se mide el formulario en blanco, se mide uno cargado (que sí desborda y
 * permite comprobar el scroll) y se cierra dando de alta una receta al toque.
 */
test.describe('Formulario de receta · móvil 375px', () => {
  test('formulario a 375px → full-bleed, sin desbordar y con targets de 44px → receta cargada: solo el cuerpo scrollea → alta por toque → la receta aparece listada', async ({
    openCatalog,
    catalog,
    form,
    grid,
    page,
  }) => {
    await openCatalog();
    const viewport = page.viewportSize()!;

    await catalog.newRecipeIn('Queques').tap();
    await form.waitReady();

    // Full-bleed: el panel ocupa toda la pantalla, sin margen.
    const panel = (await form.panel.boundingBox())!;
    expect(panel.x).toBe(0);
    expect(panel.width).toBe(viewport.width);
    expect(panel.height).toBeGreaterThanOrEqual(viewport.height - 1);

    await form.name.fill('Targets táctiles E2E');
    for (const [label, locator] of [
      ['Guardar', form.save],
      ['Cancelar', form.cancel],
      ['Cerrar', form.close],
    ] as const) {
      const box = (await locator.boundingBox())!;
      expect(box.height, `${label} debe cumplir el target táctil`).toBeGreaterThanOrEqual(44);
    }

    // Con una línea escrita, la grilla puede scrollear en su contenedor, pero el documento no.
    await grid.nameInput(0).fill(SUPPLIES.harina.name);
    await grid.quantityInput(0).fill('250');
    const table = (await grid.table.boundingBox())!;
    expect(table.x).toBeGreaterThanOrEqual(0);
    const [scrollWidth, innerWidth] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      window.innerWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    expect(innerWidth).toBe(viewport.width);

    await form.cancel.tap();
    await form.waitClosed();

    /*
     * Una receta sembrada con varias líneas: así el cuerpo tiene contenido de sobra para
     * desbordar a 375px (un formulario en blanco cabe entero y no habría scroll que comprobar).
     */
    await catalog.recipe(GLASEADO.category, GLASEADO.name).tap();
    await form.waitReady();
    const headerBefore = (await form.header.boundingBox())!;
    const footerBefore = (await form.footer.boundingBox())!;

    const scrolled = await form.body.evaluate((el) => {
      el.scrollTo({ top: el.scrollHeight });
      return { top: el.scrollTop, scrollable: el.scrollHeight > el.clientHeight };
    });
    expect(scrolled.scrollable).toBe(true);
    expect(scrolled.top).toBeGreaterThan(0);

    const headerAfter = (await form.header.boundingBox())!;
    const footerAfter = (await form.footer.boundingBox())!;
    expect(headerAfter.y).toBeCloseTo(headerBefore.y, 0);
    expect(footerAfter.y).toBeCloseTo(footerBefore.y, 0);
    await expect(form.save).toBeVisible();

    await form.cancel.tap();
    await form.waitClosed();

    // Estado terminal: el flujo completo al toque deja la receta listada.
    await catalog.newRecipeIn('Rellenos').tap();
    await form.waitReady();
    await form.name.fill('Receta móvil E2E');
    await grid.nameInput(0).fill(SUPPLIES.huevos.name);
    await grid.quantityInput(0).fill('3');
    await expect(grid.costButton(0)).toHaveText('S/ 1.50');
    await form.save.tap();
    await form.waitClosed();

    await expect(catalog.recipe('Rellenos', 'Receta móvil E2E')).toBeVisible();
  });
});
