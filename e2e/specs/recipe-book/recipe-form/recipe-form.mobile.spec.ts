import { test, expect } from '../../../fixtures/app-fixture';
import { SUPPLIES } from '../../../support/seed';

/**
 * Regla dura **mobile-first** sobre el formulario de receta, verificada a **375px**: el diálogo es
 * full-bleed (ocupa toda la pantalla, sin margen ni radio), **solo el cuerpo scrollea** con
 * cabecera y pie fijos, nada desborda en horizontal y los targets táctiles miden ≥ 44px.
 *
 * Se opera con `tap()` (el proyecto `mobile` tiene táctil), no con `click()`.
 */
test.describe('Formulario de receta · móvil 375px', () => {
  test('abrir el formulario a 375px → el diálogo ocupa toda la pantalla → Cancelar → se cierra', async ({
    openCatalog,
    catalog,
    form,
    page,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Queques').tap();
    await form.waitReady();

    const viewport = page.viewportSize()!;
    const panel = (await form.panel.boundingBox())!;
    expect(panel.x).toBe(0);
    expect(panel.width).toBe(viewport.width);
    expect(panel.height).toBeGreaterThanOrEqual(viewport.height - 1);

    await form.cancel.tap();
    await form.waitClosed();
    await expect(catalog.newRecipeIn('Queques')).toBeVisible();
  });

  test('formulario a 375px → cabecera y pie quedan fijos y solo el cuerpo scrollea → Cancelar', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();
    // Se abre una receta sembrada con varias líneas: así el cuerpo tiene contenido de sobra para
    // desbordar a 375px (un formulario en blanco cabe entero y no habría scroll que comprobar).
    await catalog.recipe('Coberturas', 'Glaseado de Queso Crema').tap();
    await form.waitReady();

    const headerBefore = (await form.header.boundingBox())!;
    const footerBefore = (await form.footer.boundingBox())!;
    // El cuerpo es la única zona scrollable del card en `fill`.
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
  });

  test('formulario a 375px → nada desborda en horizontal → Cancelar', async ({
    openCatalog,
    catalog,
    form,
    page,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Coberturas').tap();
    await form.waitReady();

    const [scrollWidth, innerWidth] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      window.innerWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);

    await form.cancel.tap();
    await form.waitClosed();
  });

  test('flujo completo por toque a 375px → nombre + insumo → Guardar → la receta aparece listada', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

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

  test('formulario a 375px → los botones de acción cumplen el target táctil de 44px → Cancelar', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').tap();
    await form.waitReady();
    await form.name.fill('Targets táctiles E2E');

    for (const [label, locator] of [
      ['Guardar', form.save],
      ['Cancelar', form.cancel],
      ['Cerrar', form.close],
    ] as const) {
      const box = (await locator.boundingBox())!;
      expect(box.height, `${label} debe cumplir el target táctil`).toBeGreaterThanOrEqual(44);
    }

    await form.cancel.tap();
    await form.waitClosed();
  });

  test('grilla de ingredientes a 375px → no aplasta la vista: cabe o scrollea en horizontal', async ({
    openCatalog,
    catalog,
    form,
    grid,
    page,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').tap();
    await form.waitReady();
    await grid.nameInput(0).fill(SUPPLIES.harina.name);
    await grid.quantityInput(0).fill('250');

    const viewport = page.viewportSize()!;
    const table = (await grid.table.boundingBox())!;
    // La tabla puede scrollear en su contenedor, pero el documento nunca desborda.
    expect(table.x).toBeGreaterThanOrEqual(0);
    const [scrollWidth, innerWidth] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      window.innerWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    expect(innerWidth).toBe(viewport.width);

    await form.cancel.tap();
    await form.waitClosed();
  });
});
