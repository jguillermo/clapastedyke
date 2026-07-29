import { test, expect } from '../../../fixtures/app-fixture';
import { SupplyListPage } from '../../../pages/supply-list.page';
import { SUPPLIES } from '../../../support/seed';

/**
 * Validación de la hoja de insumos. El autoguardado solo persiste renglones completos y coherentes;
 * lo que no cumple deja un mensaje `role="alert"` y **no** escribe nada.
 *
 * Ningún test acaba en «apareció el error»: se corrige el motivo y se llega a guardar, o se
 * comprueba releyendo que el catálogo quedó intacto.
 */
test.describe('Lista de insumos · validación', () => {
  test('vaciar el nombre de un insumo → avisa → volver a nombrarlo → se guarda', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();
    const row = await supplies.list.rowOf(SUPPLIES.sal.name);

    await supplies.list.nameInput(row).fill('');
    await supplies.list.blurRow(row);
    await expect(supplies.list.error).toHaveText('El nombre del insumo no puede quedar vacío.');

    await supplies.list.nameInput(row).fill('Sal fina E2E');
    await supplies.list.blurRow(row);
    await supplies.close.click();
    await supplies.waitClosed();

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    expect(await supplies.list.names()).toContain('Sal fina E2E');
  });

  test('precio en cero en un insumo existente → no se guarda → reabrir → conserva el precio original', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();
    const row = await supplies.list.rowOf(SUPPLIES.harina.name);

    await supplies.list.priceInput(row).fill('0');
    await supplies.list.blurRow(row);
    await supplies.close.click();
    await supplies.waitClosed();

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const reopened = await supplies.list.rowOf(SUPPLIES.harina.name);
    await expect(supplies.list.priceInput(reopened)).toHaveValue(SUPPLIES.harina.price);
  });

  test('empaque vacío en un insumo existente → no se guarda → reabrir → conserva su empaque', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();
    const row = await supplies.list.rowOf(SUPPLIES.azucarImpalpable.name);

    await supplies.list.packagingInput(row).fill('');
    await supplies.list.blurRow(row);
    await supplies.close.click();
    await supplies.waitClosed();

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const reopened = await supplies.list.rowOf(SUPPLIES.azucarImpalpable.name);
    await expect(supplies.list.packagingInput(reopened)).toHaveValue(SUPPLIES.azucarImpalpable.packaging);
  });

  test('renglón de agregar solo con nombre → no crea nada → completarlo → se crea', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();
    const add = SupplyListPage.ADD_ROW;

    await supplies.list.nameInput(add).fill('Solo nombre E2E');
    await supplies.list.blurRow(add);
    await supplies.close.click();
    await supplies.waitClosed();

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    expect(await supplies.list.names()).not.toContain('Solo nombre E2E');

    await supplies.list.addSupply('Solo nombre E2E', '100', '2');
    await supplies.close.click();
    await supplies.waitClosed();
    await catalog.suppliesButton.click();
    await supplies.waitReady();
    expect(await supplies.list.names()).toContain('Solo nombre E2E');
  });

  test('la hoja explica cómo se usa y expone su cabecera de tres columnas', async ({
    openSuppliesDialog,
    supplies,
  }) => {
    const dialog = await openSuppliesDialog();

    await expect(dialog.list.hint).toBeVisible();
    await expect(dialog.list.columnHeaders).toHaveText(['Insumo', 'Empaque', 'Precio']);

    await supplies.close.click();
    await supplies.waitClosed();
  });
});
