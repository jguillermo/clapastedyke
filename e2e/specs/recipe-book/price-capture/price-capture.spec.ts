import { test, expect } from '../../../fixtures/app-fixture';
import { SUPPLIES } from '../../../support/seed';

/**
 * Captura del **costo de compra** (`features/recipe-book/_shared/price-capture`), el popover que
 * abre el `＋ precio` de la columna Costo. Tres journeys, un arranque cada uno:
 *
 * 1. **insumo nuevo**: Guardar lo reclama, la captura se valida, y al confirmar el insumo queda
 *    dado de alta en el catálogo con su precio.
 * 2. **descartar**: Cancelar, clic fuera y Escape no fijan precio — el flujo se cierra poniéndolo.
 * 3. **insumo con precio**: la captura viene precargada, cancelar no toca nada y repreciar
 *    recalcula la línea y represa el catálogo.
 */
test.describe('Captura de precio', () => {
  test('insumo nuevo sin precio → Guardar lo reclama → Listo se habilita solo con una compra válida → confirmar → costo calculado → guardar → el insumo queda en el catálogo', async ({
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

    // Sin precio no se puede guardar: la grilla dice exactamente qué falta.
    await form.save.click();
    await expect(grid.error).toHaveText(
      'Falta el precio de "Pulpa de maracuyá E2E". Tócalo en la columna Costo.',
    );
    await expect(form.root).toBeVisible();

    await grid.costButton(0).click();
    await expect(priceCapture.forSupply('Pulpa de maracuyá E2E')).toBeVisible();

    // `Listo` solo se habilita con presentación y precio válidos.
    await expect(priceCapture.confirm).toBeDisabled();
    await expect(priceCapture.perBaseUnit).toHaveText('');
    await priceCapture.packaging.fill('500');
    await expect(priceCapture.confirm).toBeDisabled();
    await priceCapture.price.fill('0');
    await expect(priceCapture.confirm).toBeDisabled();

    // Se compra 500 g por S/ 8.00 → S/ 0.016 por g; 200 g de receta = S/ 3.20.
    await priceCapture.price.fill('8');
    await expect(priceCapture.confirm).toBeEnabled();
    await expect(priceCapture.perBaseUnit).toContainText('Te cuesta');
    await expect(priceCapture.perBaseUnit).toContainText('por g');
    await priceCapture.confirm.click();
    await expect(priceCapture.root).toHaveCount(0);
    await expect(grid.costButton(0)).toHaveText('S/ 3.20');

    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Rellenos', 'Con insumo nuevo E2E')).toBeVisible();

    // Estado terminal: el insumo nuevo está en el catálogo con su compra.
    await catalog.suppliesButton.click();
    await supplies.waitReady();
    expect(await supplies.list.names()).toContain('Pulpa de maracuyá E2E');
    await supplies.close.click();
    await supplies.waitClosed();

    // Enter en el campo de precio confirma igual que `Listo`.
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

    // Un insumo contado por unidades fija la familia de la captura: `k` no la cambia.
    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Insumo contado E2E');
    await grid.nameInput(0).fill('Physalis E2E');
    await grid.setQuantity(0, '12', 'u');
    await expect(grid.unitChip(0)).toHaveText('u');

    await grid.costButton(0).click();
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
    const physalis = await supplies.list.rowOf('Physalis E2E');
    expect(physalis).toBeGreaterThan(0);
    expect(await supplies.list.unitOf(physalis)).toBe('u');
  });

  test('captura abierta → Cancelar y clic fuera la descartan sin fijar precio → poner precio → guardar → Escape en otra captura no persiste nada', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
    home,
    page,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Descartes de la captura E2E');
    await grid.fillNewLine(0, 'Insumo sin precio E2E', '50');

    // Cancelar: el insumo sigue sin precio.
    await grid.costButton(0).click();
    await priceCapture.cancel.click();
    await expect(priceCapture.root).toHaveCount(0);
    await expect(grid.costButton(0)).toHaveText('＋ precio');

    // Clic fuera del popover: lo mismo.
    await grid.costButton(0).click();
    await priceCapture.dismissByBackdrop();
    await expect(priceCapture.root).toHaveCount(0);
    await expect(grid.costButton(0)).toHaveText('＋ precio');

    // Se cierra el flujo poniéndole precio de verdad.
    await grid.costButton(0).click();
    await priceCapture.setPurchase('100', '5');
    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Rellenos', 'Descartes de la captura E2E')).toBeVisible();

    /*
     * OJO — Escape con la captura abierta es **no determinista**: el mismo evento cierra siempre
     * el popover, pero *a veces* cierra además el diálogo de receta (y con él el libro, porque el
     * atajo del libro corre cuando su guarda `dialogOpen` ya está liberada). Por eso solo se
     * asserta lo invariante —el popover se cierra y nada se guardó— y se normaliza el estado
     * recargando la app en vez de suponer en qué vista quedó el usuario. Va al final del journey
     * justo por eso.
     */
    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Escape en la captura E2E');
    await grid.fillNewLine(0, 'Otro insumo sin precio E2E', '50');
    await grid.costButton(0).click();
    await page.keyboard.press('Escape');
    await expect(priceCapture.root).toHaveCount(0);

    await home.goto();
    await home.station('Libro de recetas').click();
    await catalog.waitReady();
    expect(await catalog.recipeNamesIn('Rellenos')).not.toContain('Escape en la captura E2E');
  });

  test('insumo del catálogo → la captura viene precargada → Cancelar no cambia el costo → repreciar recalcula la línea → guardar → el catálogo queda represado → otro empaque en kilos recalcula igual', async ({
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

    // El seed compra 1 kg por S/ 4.50 → la captura se abre con esa compra ya puesta.
    await grid.costButton(0).click();
    await expect(priceCapture.forSupply(SUPPLIES.harina.name)).toBeVisible();
    await expect(priceCapture.packaging).toHaveValue('1');
    await expect(priceCapture.price).toHaveValue(SUPPLIES.harina.price);

    // Cancelar tras tocar el precio no cambia nada.
    await priceCapture.price.fill('99');
    await priceCapture.cancel.click();
    await expect(priceCapture.root).toHaveCount(0);
    await expect(grid.costButton(0)).toHaveText('S/ 4.50');

    // Repreciar sí: 1 kg por S/ 9 → los mismos 1000 g cuestan el doble.
    await grid.costButton(0).click();
    await priceCapture.setPurchase('1', '9');
    await expect(grid.costButton(0)).toHaveText('S/ 9.00');

    await form.save.click();
    await form.waitClosed();

    // Estado terminal: el catálogo de insumos quedó represado.
    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const harina = await supplies.list.rowOf(SUPPLIES.harina.name);
    await expect(supplies.list.priceInput(harina)).toHaveValue('9');
    await supplies.close.click();
    await supplies.waitClosed();

    // Y el cambio de empaque a kilos recalcula por la misma regla de tres.
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Empaque en kilos E2E');
    // Azúcar impalpable: S/ 5.50 por 500 g → 100 g cuestan S/ 1.10.
    await grid.fillExistingLine(0, SUPPLIES.azucarImpalpable.name, '100');
    await expect(grid.costButton(0)).toHaveText('S/ 1.10');
    // Se recompra en saco de 2 kg por S/ 20 → 100 g cuestan S/ 1.00.
    await grid.costButton(0).click();
    await priceCapture.setPurchase('2', '20', 'k');
    await expect(grid.costButton(0)).toHaveText('S/ 1.00');

    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Empaque en kilos E2E')).toBeVisible();
  });
});
