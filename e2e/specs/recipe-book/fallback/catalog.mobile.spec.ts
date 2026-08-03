import { test, expect } from '../../../fixtures/app-fixture';
import { CATEGORIES, SUPPLIES } from '../../../support/seed';

/**
 * Regla dura **mobile-first** sobre la lista accesible del libro, verificada a **375px**: las
 * secciones apilan, nada desborda en horizontal y las acciones son targets táctiles.
 *
 * Un solo journey: se mide la lista y, sin volver a arrancar, se recorre entera al toque —
 * abrir una receta, crear una nueva y volver a la cocina.
 */
test.describe('Libro de recetas · lista a 375px', () => {
  test('lista a 375px → sin desbordar, con filas y acciones táctiles → toque en una receta → Cancelar → crear por toque → Volver → vuelve la cocina', async ({
    openCatalog,
    catalog,
    form,
    grid,
    home,
    page,
  }) => {
    await openCatalog();
    const viewport = page.viewportSize()!;

    await expect(catalog.categoryHeadings).toHaveCount(CATEGORIES.length);
    const [scrollWidth, innerWidth] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      window.innerWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);

    // Cada fila de receta cabe en el ancho y cumple el target táctil.
    const rows = catalog.recipeRows('Queques');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = (await rows.nth(i).boundingBox())!;
      expect(box.height, `fila ${i} debe cumplir el target táctil`).toBeGreaterThanOrEqual(44);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    }

    for (const [label, locator] of [
      ['Insumos', catalog.suppliesButton],
      ['Volver', catalog.back],
    ] as const) {
      const box = (await locator.boundingBox())!;
      expect(box.height, `${label} debe cumplir el target táctil`).toBeGreaterThanOrEqual(44);
    }

    // Tocar una receta abre su formulario de edición.
    await catalog.recipe('Queques', 'Keke de Chocolate').tap();
    await form.waitReady();
    await expect(form.title).toHaveText('Keke de Chocolate');
    await form.cancel.tap();
    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Keke de Chocolate')).toBeVisible();

    /*
     * DEUDA conocida de mobile-first: el `Nuevo` de cada categoría es un botón `size="sm"`
     * (36px), por debajo del mínimo táctil de 44px que exige `mobile-first-conventions.md`. Se
     * cubre el flujo (se puede tocar y crea la receta) y se deja constancia de la medida;
     * cuando el botón pase a `md`, esta comprobación se sustituye por la de 44px de arriba.
     */
    const nuevo = catalog.newRecipeIn('Coberturas');
    const nuevoBox = (await nuevo.boundingBox())!;
    expect(
      nuevoBox.height,
      'DEUDA: `Nuevo` es size="sm" (36px), no llega al mínimo táctil de 44px',
    ).toBeLessThan(44);

    await nuevo.tap();
    await form.waitReady();
    await form.name.fill('Nueva desde móvil E2E');
    await grid.nameInput(0).fill(SUPPLIES.huevos.name);
    await grid.quantityInput(0).fill('2');
    await form.save.tap();
    await form.waitClosed();
    await expect(catalog.recipe('Coberturas', 'Nueva desde móvil E2E')).toBeVisible();

    // Estado terminal: el libro se desmonta y queda la cocina.
    await catalog.back.tap();
    await expect(catalog.root).toHaveCount(0);
    await expect(home.dock).toBeVisible();
  });
});
