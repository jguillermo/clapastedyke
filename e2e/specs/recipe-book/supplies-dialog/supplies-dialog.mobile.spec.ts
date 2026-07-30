import { test, expect } from '../../../fixtures/app-fixture';
import { SupplyListPage } from '../../../pages/supply-list.page';

/**
 * Regla dura **mobile-first** sobre el diálogo de Insumos a **375px**: full-bleed (toda la pantalla,
 * sin margen ni radio), la hoja de insumos **no se aplasta** (crece o scrollea en horizontal dentro
 * de su contenedor, nunca desborda el documento) y el alta funciona al toque.
 */
test.describe('Diálogo de Insumos · móvil 375px', () => {
  test('abrir Insumos a 375px → el diálogo ocupa toda la pantalla → × → vuelve el libro', async ({
    openSuppliesDialog,
    supplies,
    catalog,
    page,
  }) => {
    await openSuppliesDialog();

    const viewport = page.viewportSize()!;
    const panel = (await supplies.panel.boundingBox())!;
    expect(panel.x).toBe(0);
    expect(panel.width).toBe(viewport.width);
    expect(panel.height).toBeGreaterThanOrEqual(viewport.height - 1);

    await supplies.close.tap();
    await supplies.waitClosed();
    await expect(catalog.suppliesButton).toBeVisible();
  });

  test('hoja de insumos a 375px → el documento no desborda en horizontal → cerrar', async ({
    openSuppliesDialog,
    supplies,
    page,
  }) => {
    await openSuppliesDialog();

    const [scrollWidth, innerWidth] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      window.innerWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);

    await supplies.close.tap();
    await supplies.waitClosed();
  });

  test('hoja de insumos a 375px → cabecera fija y solo el cuerpo scrollea → cerrar', async ({
    openSuppliesDialog,
    supplies,
  }) => {
    await openSuppliesDialog();
    const headerBefore = (await supplies.header.boundingBox())!;

    const scrolled = await supplies.body.evaluate((el) => {
      el.scrollTo({ top: el.scrollHeight });
      return { top: el.scrollTop, scrollable: el.scrollHeight > el.clientHeight };
    });
    expect(scrolled.scrollable).toBe(true);
    expect(scrolled.top).toBeGreaterThan(0);

    const headerAfter = (await supplies.header.boundingBox())!;
    expect(headerAfter.y).toBeCloseTo(headerBefore.y, 0);
    await expect(supplies.close).toBeVisible();

    await supplies.close.tap();
    await supplies.waitClosed();
  });

  test('alta por toque a 375px → insumo persistido → reabrir el diálogo → sigue ahí', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();
    const add = SupplyListPage.ADD_ROW;

    await supplies.list.nameInput(add).tap();
    await supplies.list.nameInput(add).fill('Chispas de chocolate E2E');
    await supplies.list.packagingInput(add).fill('120');
    await supplies.list.priceInput(add).fill('5');
    await supplies.list.priceInput(add).press('Enter');
    await expect(supplies.list.addedMark).toBeVisible();

    await supplies.close.tap();
    await supplies.waitClosed();
    await catalog.suppliesButton.tap();
    await supplies.waitReady();

    expect(await supplies.list.names()).toContain('Chispas de chocolate E2E');
  });

  /**
   * El target táctil es la **celda/control** (`min-h-11` del tema), no el `<input>` nativo que va
   * dentro: el `migo-unit-input`/`migo-currency-input` envuelven el input y son ellos los que
   * garantizan la altura. Por eso se mide la celda de la grilla.
   */
  test('celdas de la hoja a 375px → cumplen el target táctil → cerrar', async ({
    openSuppliesDialog,
    supplies,
  }) => {
    await openSuppliesDialog();
    const add = SupplyListPage.ADD_ROW;

    for (const col of [0, 1, 2] as const) {
      const box = (await supplies.list.cell(add, col).boundingBox())!;
      expect(box.height, `la celda ${col} debe cumplir el target táctil`).toBeGreaterThanOrEqual(
        44,
      );
    }

    await supplies.close.tap();
    await supplies.waitClosed();
  });
});
