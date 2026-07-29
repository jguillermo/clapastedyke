import { test, expect } from '../../../fixtures/app-fixture';

/**
 * Captura del **costo de compra** de un insumo nuevo (`app-price-capture`), abierta
 * desde el `＋ precio` de la columna Costo. El flujo completo termina con la receta
 * guardada y el insumo nuevo dado de alta en el catálogo con su precio.
 */
test.describe('Captura de precio · insumo nuevo', () => {
  test('insumo nuevo sin precio → ＋ precio → fijar compra → Listo → costo calculado → guardar → insumo en el catálogo', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
    supplies,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Con insumo nuevo E2E');

    await grid.fillNewLine(0, 'Pulpa de maracuyá E2E', '200');
    await grid.costButton(0).click();
    await expect(priceCapture.forSupply('Pulpa de maracuyá E2E')).toBeVisible();

    // Se compra 500 g por S/ 8.00 → S/ 0.016 por g; 200 g de receta = S/ 3.20.
    await priceCapture.setPurchase('500', '8');
    await expect(priceCapture.root).toHaveCount(0);
    await expect(grid.costButton(0)).toHaveText('S/ 3.20');

    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Rellenos', 'Con insumo nuevo E2E')).toBeVisible();

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    expect(await supplies.list.names()).toContain('Pulpa de maracuyá E2E');
  });

  test('captura de precio → muestra en vivo el costo por unidad base mientras se escribe → Listo → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Costo por unidad base E2E');

    await grid.fillNewLine(0, 'Miel de caña E2E', '100');
    await grid.costButton(0).click();

    await expect(priceCapture.perBaseUnit).toHaveText('');
    await priceCapture.packaging.fill('500');
    await priceCapture.price.fill('8');
    await expect(priceCapture.perBaseUnit).toContainText('Te cuesta');
    await expect(priceCapture.perBaseUnit).toContainText('por g');

    await priceCapture.confirm.click();
    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Rellenos', 'Costo por unidad base E2E')).toBeVisible();
  });

  test('captura de precio incompleta → Listo deshabilitado → completar → se habilita → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Listo se habilita E2E');

    await grid.fillNewLine(0, 'Ralladura E2E', '20');
    await grid.costButton(0).click();

    await expect(priceCapture.confirm).toBeDisabled();
    await priceCapture.packaging.fill('100');
    await expect(priceCapture.confirm).toBeDisabled();
    await priceCapture.price.fill('4');
    await expect(priceCapture.confirm).toBeEnabled();

    await priceCapture.confirm.click();
    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Rellenos', 'Listo se habilita E2E')).toBeVisible();
  });

  test('precio cero o negativo → Listo sigue deshabilitado → poner un precio válido → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Precio válido E2E');

    await grid.fillNewLine(0, 'Colorante E2E', '5');
    await grid.costButton(0).click();
    await priceCapture.packaging.fill('50');

    await priceCapture.price.fill('0');
    await expect(priceCapture.confirm).toBeDisabled();

    await priceCapture.price.fill('3.5');
    await expect(priceCapture.confirm).toBeEnabled();
    await priceCapture.confirm.click();

    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Rellenos', 'Precio válido E2E')).toBeVisible();
  });

  test('Enter en el campo de precio → confirma la compra → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Confirmar con Enter E2E');

    await grid.fillNewLine(0, 'Anís E2E', '10');
    await grid.costButton(0).click();
    await priceCapture.packaging.fill('100');
    await priceCapture.price.fill('6');
    await priceCapture.price.press('Enter');

    await expect(priceCapture.root).toHaveCount(0);
    await expect(grid.costButton(0)).toHaveText('S/ 0.60');

    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Rellenos', 'Confirmar con Enter E2E')).toBeVisible();
  });

  test('insumo nuevo contado por unidades → la captura queda fijada en u → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
    supplies,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Insumo contado E2E');

    // Sin precio aún, la cantidad tecleada con `u` fija la familia de conteo.
    await grid.nameInput(0).fill('Physalis E2E');
    await grid.setQuantity(0, '12', 'u');
    // Aserción con auto-retry: el chip de unidad se repinta un tick después de la pulsación.
    await expect(grid.unitChip(0)).toHaveText('u');

    await grid.costButton(0).click();
    // Al venir la fila en conteo, la presentación queda bloqueada en unidades: aunque se
    // pulse `k` (kilos), el chip sigue mostrando `u`.
    await priceCapture.packaging.fill('1');
    await priceCapture.packaging.press('k');
    await expect(priceCapture.packagingUnit).toContainText('u');

    await priceCapture.price.fill('0.8');
    await priceCapture.confirm.click();
    await expect(grid.costButton(0)).toHaveText('S/ 9.60');

    await form.save.click();
    await form.waitClosed();

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const row = await supplies.list.rowOf('Physalis E2E');
    expect(row).toBeGreaterThan(0);
    expect(await supplies.list.unitOf(row)).toBe('u');
  });
});
