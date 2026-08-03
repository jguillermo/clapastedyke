import { test, expect } from '../../../fixtures/app-fixture';
import { SupplyListPage } from '../../../pages/supply-list.page';
import { SUPPLIES, SUPPLY_COUNT } from '../../../support/seed';

/**
 * Hoja editable de insumos (`features/recipe-book/supply-list`): el renglón de agregar es el
 * primero y cada renglón **se autoguarda al salir de él**. Tres journeys, un arranque cada uno —
 * alta, edición y validación —, y dentro de cada uno el diálogo se cierra y se reabre tantas
 * veces como haga falta, que es barato: no recarga la app.
 *
 * El estado terminal nunca es la marca de comprobación (es transitoria), sino el insumo
 * **releído** del catálogo o su efecto en el costo de una receta.
 */
test.describe('Lista de insumos · agregar', () => {
  test('renglón incompleto no crea nada → completarlo lo persiste → varios seguidos → kilos y unidades se releen normalizados → un nombre existente re-tarifa sin duplicar → el insumo nuevo ya costea en una receta', async ({
    openSuppliesDialog,
    supplies,
    catalog,
    form,
    grid,
  }) => {
    await openSuppliesDialog();
    const add = SupplyListPage.ADD_ROW;

    // Sin precio no hay nada que guardar: al salir del renglón no aparece la marca.
    await supplies.list.nameInput(add).fill('Insumo a medias E2E');
    await supplies.list.packagingInput(add).fill('100');
    await supplies.list.blurRow(add);
    await expect(supplies.list.addedMark).toHaveCount(0);

    // Se completa y sí se crea. La marca sí es visible aquí (es el primer alta del journey),
    // pero lo que dice que aterrizó es el renglón de agregar vacío otra vez.
    await supplies.list.priceInput(add).fill('4');
    await supplies.list.priceInput(add).press('Enter');
    // Es el primer alta del journey: hay exactamente una marca, así que se exige sin `.first()`.
    await expect(supplies.list.addedMark).toBeVisible();
    await supplies.list.waitAdded();

    // Varios seguidos sin cerrar el diálogo.
    await supplies.list.addSupply('Nuez pecana E2E', '200', '15');
    await supplies.list.addSupply('Almendra laminada E2E', '150', '11');

    // Comprado por kilos: 2 kg se guardan como 2000 g.
    await supplies.list.addSupply('Harina integral E2E', '2', '9', 'k');

    // Contado por unidades.
    await supplies.list.addSupply('Molde de papel E2E', '1', '0.25', 'u');

    /*
     * `SaveSupply` es un **upsert por nombre** (case-insensitive): escribir en el renglón de
     * agregar un nombre que ya existe NO duplica el insumo, lo re-tarifa.
     */
    await supplies.list.addSupply(SUPPLIES.sal.name, '1', '2.75', 'k');

    // Todo se comprueba releyendo el catálogo, no con la marca.
    await supplies.close.click();
    await supplies.waitClosed();
    await catalog.suppliesButton.click();
    await supplies.waitReady();

    const names = await supplies.list.names();
    for (const created of [
      'Insumo a medias E2E',
      'Nuez pecana E2E',
      'Almendra laminada E2E',
      'Harina integral E2E',
      'Molde de papel E2E',
    ]) {
      expect(names).toContain(created);
    }
    // Cinco insumos nuevos (la «Sal» re-tarifada no cuenta) más el renglón de agregar.
    await expect(supplies.list.rows).toHaveCount(SUPPLY_COUNT + 6);
    expect(names.filter((name) => name === SUPPLIES.sal.name)).toHaveLength(1);

    const aMedias = await supplies.list.rowOf('Insumo a medias E2E');
    await expect(supplies.list.packagingInput(aMedias)).toHaveValue('100');
    await expect(supplies.list.priceInput(aMedias)).toHaveValue('4');
    expect(await supplies.list.unitOf(aMedias)).toBe('g');

    // 2 kg guardados como 2000 g se vuelven a mostrar en kg (≥ 1000 g → kg).
    const integral = await supplies.list.rowOf('Harina integral E2E');
    await expect(supplies.list.packagingInput(integral)).toHaveValue('2');
    expect(await supplies.list.unitOf(integral)).toBe('kg');

    const molde = await supplies.list.rowOf('Molde de papel E2E');
    expect(await supplies.list.unitOf(molde)).toBe('u');

    const sal = await supplies.list.rowOf(SUPPLIES.sal.name);
    await expect(supplies.list.priceInput(sal)).toHaveValue('2.75');

    // Estado terminal: el insumo nuevo cuesta por pieza dentro de una receta guardada.
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
});

test.describe('Lista de insumos · editar', () => {
  test('renombrar, repreciar y recomprar en otro empaque → se releen tal cual → la familia de unidad no se puede cambiar → editar sin tocar nada no altera el catálogo → una receta usa los precios nuevos', async ({
    openSuppliesDialog,
    supplies,
    catalog,
    form,
    grid,
  }) => {
    await openSuppliesDialog();

    // Renombrar.
    const sal = await supplies.list.rowOf(SUPPLIES.sal.name);
    await supplies.list.nameInput(sal).fill('Sal de mesa E2E');
    await supplies.list.blurRow(sal);

    // Repreciar: el seed compra 1 huevo por S/ 0.50; se re-tarifa a S/ 0.80.
    const huevos = await supplies.list.rowOf(SUPPLIES.huevos.name);
    await supplies.list.priceInput(huevos).fill('0.8');
    await supplies.list.blurRow(huevos);

    // Recomprar en otro empaque: del seed S/ 5.50 por 500 g → saco de 2 kg por S/ 16.
    const azucar = await supplies.list.rowOf(SUPPLIES.azucarImpalpable.name);
    await supplies.list.packagingInput(azucar).fill('2');
    await supplies.list.packagingInput(azucar).press('k');
    await supplies.list.priceInput(azucar).fill('16');
    await supplies.list.blurRow(azucar);

    await supplies.close.click();
    await supplies.waitClosed();
    await catalog.suppliesButton.click();
    await supplies.waitReady();

    // Se renombró, no se duplicó: el catálogo no ganó ni perdió insumos.
    const names = await supplies.list.names();
    expect(names).toContain('Sal de mesa E2E');
    expect(names).not.toContain(SUPPLIES.sal.name);
    await expect(supplies.list.rows).toHaveCount(SUPPLY_COUNT + 1);

    const azucarReleido = await supplies.list.rowOf(SUPPLIES.azucarImpalpable.name);
    await expect(supplies.list.packagingInput(azucarReleido)).toHaveValue('2');
    expect(await supplies.list.unitOf(azucarReleido)).toBe('kg');

    // Un insumo de masa no acepta `u`: la familia queda fija.
    await supplies.list.packagingInput(azucarReleido).press('u');
    await supplies.list.blurRow(azucarReleido);
    await supplies.close.click();
    await supplies.waitClosed();
    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const azucarTrasU = await supplies.list.rowOf(SUPPLIES.azucarImpalpable.name);
    expect(await supplies.list.unitOf(azucarTrasU)).toBe('kg');

    // Y uno de conteo no acepta `k`.
    const huevosReleido = await supplies.list.rowOf(SUPPLIES.huevos.name);
    await supplies.list.packagingInput(huevosReleido).press('k');
    await supplies.list.blurRow(huevosReleido);
    await supplies.close.click();
    await supplies.waitClosed();
    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const huevosTrasK = await supplies.list.rowOf(SUPPLIES.huevos.name);
    expect(await supplies.list.unitOf(huevosTrasK)).toBe('u');

    // Entrar y salir de un renglón sin cambiar nada no escribe.
    const before = await supplies.list.names();
    const harina = await supplies.list.rowOf(SUPPLIES.harina.name);
    await supplies.list.nameInput(harina).click();
    await supplies.list.blurRow(harina);
    await supplies.close.click();
    await supplies.waitClosed();
    await catalog.suppliesButton.click();
    await supplies.waitReady();
    expect(await supplies.list.names()).toEqual(before);

    // Estado terminal: una receta costea con los precios nuevos y se guarda.
    await supplies.close.click();
    await supplies.waitClosed();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Precios represados E2E');
    await grid.fillExistingLine(0, SUPPLIES.huevos.name, '5'); // 5 × S/ 0.80
    await expect(grid.costButton(0)).toHaveText('S/ 4.00');
    await grid.fillExistingLine(1, SUPPLIES.azucarImpalpable.name, '100'); // 100 g × S/ 0.008
    await expect(grid.costButton(1)).toHaveText('S/ 0.80');
    await form.save.click();
    await form.waitClosed();

    await expect(catalog.recipe('Queques', 'Precios represados E2E')).toBeVisible();
  });
});

test.describe('Lista de insumos · validación', () => {
  test('nombre vacío avisa y no escribe → renombrarlo sí → precio en cero, empaque vacío y renglón solo con nombre no crean ni cambian nada → completarlo → se crea', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();
    const add = SupplyListPage.ADD_ROW;

    // Nombre vacío: avisa y no guarda.
    const sal = await supplies.list.rowOf(SUPPLIES.sal.name);
    await supplies.list.nameInput(sal).fill('');
    await supplies.list.blurRow(sal);
    await expect(supplies.list.error).toHaveText('El nombre del insumo no puede quedar vacío.');

    // Se corrige el motivo y entonces sí escribe.
    await supplies.list.nameInput(sal).fill('Sal fina E2E');
    await supplies.list.blurRow(sal);

    // Precio en cero y empaque vacío: no se persisten.
    const harina = await supplies.list.rowOf(SUPPLIES.harina.name);
    await supplies.list.priceInput(harina).fill('0');
    await supplies.list.blurRow(harina);

    const azucar = await supplies.list.rowOf(SUPPLIES.azucarImpalpable.name);
    await supplies.list.packagingInput(azucar).fill('');
    await supplies.list.blurRow(azucar);

    // Renglón de agregar solo con nombre: no crea nada.
    await supplies.list.nameInput(add).fill('Solo nombre E2E');
    await supplies.list.blurRow(add);

    await supplies.close.click();
    await supplies.waitClosed();
    await catalog.suppliesButton.click();
    await supplies.waitReady();

    const names = await supplies.list.names();
    expect(names).toContain('Sal fina E2E');
    expect(names).not.toContain('Solo nombre E2E');

    const harinaReleida = await supplies.list.rowOf(SUPPLIES.harina.name);
    await expect(supplies.list.priceInput(harinaReleida)).toHaveValue(SUPPLIES.harina.price);
    const azucarReleido = await supplies.list.rowOf(SUPPLIES.azucarImpalpable.name);
    await expect(supplies.list.packagingInput(azucarReleido)).toHaveValue(
      SUPPLIES.azucarImpalpable.packaging,
    );

    // Estado terminal: completo, el insumo sí se crea y se relee.
    await supplies.list.addSupply('Solo nombre E2E', '100', '2');
    await supplies.close.click();
    await supplies.waitClosed();
    await catalog.suppliesButton.click();
    await supplies.waitReady();
    expect(await supplies.list.names()).toContain('Solo nombre E2E');

    await supplies.close.click();
    await supplies.waitClosed();
    await expect(catalog.suppliesButton).toBeEnabled();
  });
});
