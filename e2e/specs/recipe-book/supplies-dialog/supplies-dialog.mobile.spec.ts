import { test, expect } from '../../../fixtures/app-fixture';
import { SupplyListPage } from '../../../pages/supply-list.page';

/**
 * Regla dura **mobile-first** sobre el diálogo de Insumos a **375px**: full-bleed (toda la
 * pantalla, sin margen ni radio), cabecera fija con solo el cuerpo scrolleando, la hoja no se
 * aplasta y sus celdas son targets táctiles.
 *
 * Un solo journey: se mide el diálogo y, sin volver a arrancar, se da de alta un insumo al toque
 * y se comprueba releyéndolo.
 */
test.describe('Diálogo de Insumos · móvil 375px', () => {
  test('Insumos a 375px → full-bleed, sin desbordar, cabecera fija y celdas táctiles → alta por toque → reabrir → el insumo sigue ahí', async ({
    openSuppliesDialog,
    supplies,
    catalog,
    page,
  }) => {
    await openSuppliesDialog();
    const viewport = page.viewportSize()!;
    const add = SupplyListPage.ADD_ROW;

    const panel = (await supplies.panel.boundingBox())!;
    expect(panel.x).toBe(0);
    expect(panel.width).toBe(viewport.width);
    expect(panel.height).toBeGreaterThanOrEqual(viewport.height - 1);

    const [scrollWidth, innerWidth] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      window.innerWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);

    /*
     * El target táctil es la **celda/control** (`min-h-11` del tema), no el `<input>` nativo que
     * va dentro: el `migo-unit-input`/`migo-currency-input` envuelven el input y son ellos los
     * que garantizan la altura. Por eso se mide la celda de la grilla.
     */
    for (const col of [0, 1, 2] as const) {
      const box = (await supplies.list.cell(add, col).boundingBox())!;
      expect(box.height, `la celda ${col} debe cumplir el target táctil`).toBeGreaterThanOrEqual(
        44,
      );
    }

    // Solo el cuerpo scrollea: la cabecera se queda donde estaba.
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

    // Alta por toque.
    await supplies.list.nameInput(add).tap();
    await supplies.list.nameInput(add).fill('Chispas de chocolate E2E');
    await supplies.list.packagingInput(add).fill('120');
    await supplies.list.priceInput(add).fill('5');
    await supplies.list.priceInput(add).press('Enter');
    await supplies.list.waitAdded();

    // Estado terminal: el insumo persistido, releído al reabrir el diálogo.
    await supplies.close.tap();
    await supplies.waitClosed();
    await catalog.suppliesButton.tap();
    await supplies.waitReady();
    expect(await supplies.list.names()).toContain('Chispas de chocolate E2E');

    await supplies.close.tap();
    await supplies.waitClosed();
    await expect(catalog.suppliesButton).toBeVisible();
  });
});
