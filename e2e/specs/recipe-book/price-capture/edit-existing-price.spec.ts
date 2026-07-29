import { test, expect } from '../../../fixtures/app-fixture';
import { SUPPLIES } from '../../../support/seed';

/**
 * Tocar el costo de un insumo **que ya tiene precio** abre la misma captura,
 * precargada con su compra, para verla o cambiarla. El cambio se propaga al costo de
 * la línea y, al guardar, al catálogo de insumos.
 */
test.describe('Captura de precio · insumo con precio', () => {
  test('tocar el costo de un insumo del catálogo → la captura viene precargada con su compra → cerrar', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();

    await grid.fillExistingLine(0, SUPPLIES.harina.name, '500');
    await grid.costButton(0).click();

    await expect(priceCapture.forSupply(SUPPLIES.harina.name)).toBeVisible();
    // El seed compra 1 kg por S/ 4.50 → se muestra como 1 (kg) y 4.5.
    await expect(priceCapture.packaging).toHaveValue('1');
    await expect(priceCapture.price).toHaveValue('4.5');

    await priceCapture.cancel.click();
    await expect(priceCapture.root).toHaveCount(0);
    await form.cancel.click();
    await form.waitClosed();
  });

  test('cambiar la compra de un insumo del catálogo → el costo de la línea se recalcula → guardar → el catálogo queda represado', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
    supplies,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Reprecio desde la receta E2E');

    await grid.fillExistingLine(0, SUPPLIES.harina.name, '1000');
    await expect(grid.costButton(0)).toHaveText('S/ 4.50');

    await grid.costButton(0).click();
    await priceCapture.setPurchase('1', '9');
    await expect(grid.costButton(0)).toHaveText('S/ 9.00');

    await form.save.click();
    await form.waitClosed();

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const row = await supplies.list.rowOf(SUPPLIES.harina.name);
    await expect(supplies.list.priceInput(row)).toHaveValue('9');
  });

  test('abrir la captura y cancelar → el costo de la línea no cambia → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Cancelar el reprecio E2E');

    await grid.fillExistingLine(0, SUPPLIES.huevos.name, '4');
    await expect(grid.costButton(0)).toHaveText('S/ 2.00');

    await grid.costButton(0).click();
    await priceCapture.price.fill('99');
    await priceCapture.cancel.click();

    await expect(priceCapture.root).toHaveCount(0);
    await expect(grid.costButton(0)).toHaveText('S/ 2.00');

    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Cancelar el reprecio E2E')).toBeVisible();
  });

  test('insumo comprado en gramos → alternar el empaque a kg → el costo se recalcula → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Empaque en kilos E2E');

    // Azúcar impalpable: S/ 5.50 por 500 g → 100 g cuestan S/ 1.10.
    await grid.fillExistingLine(0, SUPPLIES.azucarImpalpable.name, '100');
    await expect(grid.costButton(0)).toHaveText('S/ 1.10');

    await grid.costButton(0).click();
    // Se recompra en saco de 2 kg por S/ 20 → 100 g cuestan S/ 1.00.
    await priceCapture.setPurchase('2', '20', 'k');
    await expect(grid.costButton(0)).toHaveText('S/ 1.00');

    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Empaque en kilos E2E')).toBeVisible();
  });
});
