import { test, expect } from '../../../fixtures/app-fixture';
import { SupplyListPage } from '../../../pages/supply-list.page';
import { SUPPLY_COUNT } from '../../../support/seed';

/**
 * Alta de insumos en la hoja editable (`features/recipe-book/supply-list`): el renglón de agregar es
 * el primero; al completarlo (nombre + empaque + precio) se guarda solo y se inserta otro renglón
 * vacío arriba para seguir añadiendo.
 *
 * El estado terminal es el insumo **persistido**: se comprueba reabriendo el diálogo (o usándolo en
 * una receta), no con la marca de comprobación, que es transitoria.
 */
test.describe('Lista de insumos · agregar', () => {
  test('renglón de agregar completo → Enter → insumo persistido → reabrir el diálogo → sigue ahí', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();

    await supplies.list.addSupply('Levadura seca E2E', '100', '3');
    await supplies.close.click();
    await supplies.waitClosed();

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const names = await supplies.list.names();
    expect(names).toContain('Levadura seca E2E');
    await expect(supplies.list.rows).toHaveCount(SUPPLY_COUNT + 2);
  });

  test('insumo agregado → su empaque y precio se releen tal como se guardaron', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();

    await supplies.list.addSupply('Esencia de ron E2E', '250', '7.5');
    await supplies.close.click();
    await supplies.waitClosed();

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const row = await supplies.list.rowOf('Esencia de ron E2E');
    await expect(supplies.list.packagingInput(row)).toHaveValue('250');
    await expect(supplies.list.priceInput(row)).toHaveValue('7.5');
    expect(await supplies.list.unitOf(row)).toBe('g');
  });

  test('dos insumos seguidos sin cerrar → ambos quedan persistidos', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();

    await supplies.list.addSupply('Nuez pecana E2E', '200', '15');
    await supplies.list.addSupply('Almendra laminada E2E', '150', '11');
    await supplies.close.click();
    await supplies.waitClosed();

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const names = await supplies.list.names();
    expect(names).toContain('Nuez pecana E2E');
    expect(names).toContain('Almendra laminada E2E');
  });

  test('insumo comprado por kilos → se relee normalizado en kg', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();
    const add = SupplyListPage.ADD_ROW;

    await supplies.list.nameInput(add).fill('Harina integral E2E');
    await supplies.list.packagingInput(add).fill('2');
    await supplies.list.packagingInput(add).press('k');
    await supplies.list.priceInput(add).fill('9');
    await supplies.list.priceInput(add).press('Enter');
    await expect(supplies.list.addedMark).toBeVisible();

    await supplies.close.click();
    await supplies.waitClosed();
    await catalog.suppliesButton.click();
    await supplies.waitReady();

    // 2 kg se guardan como 2000 g y se vuelven a mostrar en kg (≥ 1000 g → kg).
    const row = await supplies.list.rowOf('Harina integral E2E');
    await expect(supplies.list.packagingInput(row)).toHaveValue('2');
    expect(await supplies.list.unitOf(row)).toBe('kg');
  });

  test('insumo contado por unidades → se relee en u y cuesta por pieza en una receta', async ({
    openSuppliesDialog,
    supplies,
    catalog,
    form,
    grid,
  }) => {
    await openSuppliesDialog();
    const add = SupplyListPage.ADD_ROW;

    await supplies.list.nameInput(add).fill('Molde de papel E2E');
    await supplies.list.packagingInput(add).fill('1');
    await supplies.list.packagingInput(add).press('u');
    await supplies.list.priceInput(add).fill('0.25');
    await supplies.list.priceInput(add).press('Enter');
    await expect(supplies.list.addedMark).toBeVisible();

    await supplies.close.click();
    await supplies.waitClosed();

    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Con moldes de papel E2E');
    await grid.fillExistingLine(0, 'Molde de papel E2E', '8');
    expect(await grid.unitOf(0)).toBe('u');
    await expect(grid.costButton(0)).toHaveText('S/ 2.00');
    await form.save.click();
    await form.waitClosed();

    await expect(catalog.recipe('Queques', 'Con moldes de papel E2E')).toBeVisible();
  });

  test('renglón de agregar incompleto (sin precio) → no se crea nada → completarlo → se crea', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();
    const add = SupplyListPage.ADD_ROW;

    await supplies.list.nameInput(add).fill('Insumo a medias E2E');
    await supplies.list.packagingInput(add).fill('100');
    // Salir del renglón sin precio: no hay nada que guardar, así que no aparece la marca.
    await supplies.list.blurRow(add);
    await expect(supplies.list.addedMark).toHaveCount(0);

    await supplies.list.priceInput(add).fill('4');
    await supplies.list.priceInput(add).press('Enter');
    await expect(supplies.list.addedMark).toBeVisible();

    await supplies.close.click();
    await supplies.waitClosed();
    await catalog.suppliesButton.click();
    await supplies.waitReady();
    expect(await supplies.list.names()).toContain('Insumo a medias E2E');
  });

  /**
   * `SaveSupply` es un **upsert por nombre** (case-insensitive): escribir en el renglón de agregar un
   * nombre que ya existe NO duplica el insumo — lo re-tarifa. El estado terminal es el catálogo
   * releído: un único «Sal», con el precio nuevo.
   */
  test('nombre que ya existe en el renglón de agregar → re-tarifa el insumo → no se duplica', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();
    const add = SupplyListPage.ADD_ROW;

    await supplies.list.nameInput(add).fill('Sal');
    await supplies.list.packagingInput(add).fill('1');
    await supplies.list.packagingInput(add).press('k');
    await supplies.list.priceInput(add).fill('2.75');
    await supplies.list.priceInput(add).press('Enter');
    // Al ser el MISMO insumo, la marca se pinta en las dos filas que comparten su id (la tecleada y
    // la sembrada): basta con que aparezca.
    await expect(supplies.list.addedMark.first()).toBeVisible();

    await supplies.close.click();
    await supplies.waitClosed();
    await catalog.suppliesButton.click();
    await supplies.waitReady();

    const names = await supplies.list.names();
    expect(names.filter((name) => name === 'Sal')).toHaveLength(1);
    const row = await supplies.list.rowOf('Sal');
    await expect(supplies.list.priceInput(row)).toHaveValue('2.75');
  });
});
