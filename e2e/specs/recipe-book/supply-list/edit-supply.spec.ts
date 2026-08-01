import { test, expect } from '../../../fixtures/app-fixture';
import { SUPPLIES, SUPPLY_COUNT } from '../../../support/seed';

/**
 * Edición en línea de los insumos existentes: cada renglón **se autoguarda al salir de él**
 * (focusout a otra fila), persistiendo sobre el id de la fila. Se puede renombrar y re-tarifar; la
 * familia de unidad queda fija (masa no acepta `u`, conteo solo `u`).
 *
 * Estado terminal = el cambio releído del catálogo (reabriendo el diálogo) o su efecto en el costo
 * de una receta.
 */
test.describe('Lista de insumos · editar', () => {
  test('renombrar un insumo → salir del renglón → reabrir el diálogo → conserva el nombre nuevo', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();
    const row = await supplies.list.rowOf(SUPPLIES.sal.name);

    await supplies.list.nameInput(row).fill('Sal de mesa E2E');
    await supplies.list.blurRow(row);

    await supplies.close.click();
    await supplies.waitClosed();
    await catalog.suppliesButton.click();
    await supplies.waitReady();

    const names = await supplies.list.names();
    expect(names).toContain('Sal de mesa E2E');
    expect(names).not.toContain(SUPPLIES.sal.name);
    // Se renombró: el catálogo no ganó ni perdió insumos.
    await expect(supplies.list.rows).toHaveCount(SUPPLY_COUNT + 1);
  });

  test('cambiar el precio de un insumo → una receta con él muestra el costo nuevo → guardar', async ({
    openSuppliesDialog,
    supplies,
    catalog,
    form,
    grid,
  }) => {
    await openSuppliesDialog();
    const row = await supplies.list.rowOf(SUPPLIES.huevos.name);

    // El seed compra 1 huevo por S/ 0.50; se re-tarifa a S/ 0.80.
    await supplies.list.priceInput(row).fill('0.8');
    await supplies.list.blurRow(row);
    await supplies.close.click();
    await supplies.waitClosed();

    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Huevos represados E2E');
    await grid.fillExistingLine(0, SUPPLIES.huevos.name, '5');
    await expect(grid.costButton(0)).toHaveText('S/ 4.00');
    await form.save.click();
    await form.waitClosed();

    await expect(catalog.recipe('Queques', 'Huevos represados E2E')).toBeVisible();
  });

  test('cambiar el empaque a kilos → el costo por gramo baja en la receta → guardar', async ({
    openSuppliesDialog,
    supplies,
    catalog,
    form,
    grid,
  }) => {
    await openSuppliesDialog();
    const row = await supplies.list.rowOf(SUPPLIES.azucarImpalpable.name);

    // Del seed: S/ 5.50 por 500 g. Se recompra un saco de 2 kg por S/ 16 → 100 g cuestan S/ 0.80.
    await supplies.list.packagingInput(row).fill('2');
    await supplies.list.packagingInput(row).press('k');
    await supplies.list.priceInput(row).fill('16');
    await supplies.list.blurRow(row);
    await supplies.close.click();
    await supplies.waitClosed();

    await catalog.newRecipeIn('Coberturas').click();
    await form.waitReady();
    await form.name.fill('Azúcar en saco E2E');
    await grid.fillExistingLine(0, SUPPLIES.azucarImpalpable.name, '100');
    await expect(grid.costButton(0)).toHaveText('S/ 0.80');
    await form.save.click();
    await form.waitClosed();

    await expect(catalog.recipe('Coberturas', 'Azúcar en saco E2E')).toBeVisible();
  });

  test('insumo de masa → pulsar `u` no cambia su familia → sigue en gramos al reabrir', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();
    const row = await supplies.list.rowOf(SUPPLIES.azucarImpalpable.name);

    await supplies.list.packagingInput(row).press('u');
    await supplies.list.blurRow(row);
    await supplies.close.click();
    await supplies.waitClosed();

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const reopened = await supplies.list.rowOf(SUPPLIES.azucarImpalpable.name);
    expect(await supplies.list.unitOf(reopened)).toBe('g');
  });

  test('insumo de conteo → pulsar `k` no cambia su familia → sigue en unidades al reabrir', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();
    const row = await supplies.list.rowOf(SUPPLIES.huevos.name);

    await supplies.list.packagingInput(row).press('k');
    await supplies.list.blurRow(row);
    await supplies.close.click();
    await supplies.waitClosed();

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const reopened = await supplies.list.rowOf(SUPPLIES.huevos.name);
    expect(await supplies.list.unitOf(reopened)).toBe('u');
  });

  test('editar sin cambiar nada → salir del renglón → el catálogo queda idéntico', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    const dialog = await openSuppliesDialog();
    const before = await dialog.list.names();
    const row = await supplies.list.rowOf(SUPPLIES.harina.name);

    await supplies.list.nameInput(row).click();
    await supplies.list.blurRow(row);
    await supplies.close.click();
    await supplies.waitClosed();

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    expect(await supplies.list.names()).toEqual(before);
  });
});
