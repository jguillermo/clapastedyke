import { test, expect } from '../../../fixtures/app-fixture';
import { GLASEADO, SUPPLIES } from '../../../support/seed';

/**
 * Grilla de ingredientes (`features/recipe-book/_shared/supply-grid`), en tres journeys — uno
 * por eje del control, cada uno con un solo arranque de la app:
 *
 * 1. **filas**: el renglón vacío final, quitar filas y la validación de «al menos un ingrediente».
 * 2. **costo**: la regla de tres del negocio (`PreviewRecipeCost`) y el total de materiales.
 * 3. **autocompletado**: el fantasma del combobox y su desplegable (ratón, teclado y Escape).
 *
 * Los importes salen del seed: harina S/ 4.50 por 1 kg → S/ 0.0045/g; huevos S/ 0.50 por unidad;
 * azúcar impalpable S/ 5.50 por 500 g → S/ 0.011/g.
 */
test.describe('Grilla de ingredientes', () => {
  test('grilla nueva → un renglón vacío sin quitar → escribir añade renglones y suma el total → quitar del medio recoloca y recalcula → guardar → reabrir → vaciarla avisa → añadir insumo → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Quitar del medio E2E');

    // Arranca con un único renglón vacío: sin quitar fila y sin total que mostrar.
    await expect(grid.rows).toHaveCount(1);
    await expect(grid.columnHeaders).toHaveText(['Ingrediente', 'Cantidad', 'Costo', '']);
    await expect(grid.nameInput(0)).toHaveValue('');
    await expect(grid.removeRowButton(0)).toHaveCount(0);
    await expect(grid.materialTotalLabel).toHaveCount(0);

    // Escribir en el último renglón añade otro vacío debajo; el lleno ya ofrece quitar fila.
    await grid.fillExistingLine(0, SUPPLIES.harina.name, '1000'); // S/ 4.50
    await expect(grid.rows).toHaveCount(2);
    await expect(grid.removeRowButton(0)).toBeVisible();
    await expect(grid.removeRowButton(1)).toHaveCount(0);
    await expect(grid.materialTotalLabel).toBeVisible();
    await expect(grid.materialTotal).toHaveText('S/ 4.50');

    await grid.fillExistingLine(1, SUPPLIES.huevos.name, '2'); // S/ 1.00
    await expect(grid.rows).toHaveCount(3);
    await expect(grid.materialTotal).toHaveText('S/ 5.50');

    await grid.fillExistingLine(2, SUPPLIES.azucarImpalpable.name, '500'); // S/ 5.50
    await expect(grid.materialTotal).toHaveText('S/ 11.00');

    // Quitar la del medio: la de abajo sube y el total pierde su importe.
    await grid.removeRowButton(1).click();
    await expect(grid.nameInput(1)).toHaveValue(SUPPLIES.azucarImpalpable.name);
    await expect(grid.materialTotal).toHaveText('S/ 10.00');

    await form.save.click();
    await form.waitClosed();

    // Se relee con las dos líneas que quedaron, más el renglón vacío final.
    await catalog.recipe('Queques', 'Quitar del medio E2E').click();
    await form.waitReady();
    await expect(grid.nameInput(0)).toHaveValue(SUPPLIES.harina.name);
    await expect(grid.nameInput(1)).toHaveValue(SUPPLIES.azucarImpalpable.name);
    await expect(grid.rows).toHaveCount(3);

    // Vaciarla del todo deja un renglón vacío y Guardar avisa en vez de escribir.
    await grid.removeRowButton(0).click();
    await grid.removeRowButton(0).click();
    await expect(grid.rows).toHaveCount(1);
    await expect(grid.nameInput(0)).toHaveValue('');
    await form.save.click();
    await expect(grid.error).toHaveText('Agrega al menos un ingrediente.');

    // Estado terminal: se corrige el motivo y se llega a guardar.
    await grid.fillExistingLine(0, SUPPLIES.huevos.name, '2');
    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Quitar del medio E2E')).toBeVisible();
  });

  test('insumo del catálogo → costo y total por regla de tres → cambiar la cantidad recalcula → la unidad la dicta el precio (g / u) → guardar → una receta sembrada ya trae sus costos calculados', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Costo de materiales E2E');

    // 250 g de harina a S/ 0.0045/g = S/ 1.125 → se muestra redondeado.
    await grid.fillExistingLine(0, SUPPLIES.harina.name, '250');
    await expect(grid.costButton(0)).toHaveText('S/ 1.13');
    await expect(grid.materialTotal).toHaveText('S/ 1.13');

    await grid.quantityInput(0).fill('1000');
    await expect(grid.costButton(0)).toHaveText('S/ 4.50');
    await expect(grid.materialTotal).toHaveText('S/ 4.50');

    await grid.fillExistingLine(1, SUPPLIES.huevos.name, '3');
    await expect(grid.costButton(1)).toHaveText('S/ 1.50');
    await expect(grid.materialTotal).toHaveText('S/ 6.00');

    // La familia de unidad no la elige el usuario: la dicta cómo se compra el insumo.
    expect(await grid.unitOf(0)).toBe('g');
    expect(await grid.unitOf(1)).toBe('u');

    await grid.quantityInput(1).fill('10');
    await expect(grid.costButton(1)).toHaveText('S/ 5.00');
    await expect(grid.materialTotal).toHaveText('S/ 9.50');

    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Costo de materiales E2E')).toBeVisible();

    // Una receta sembrada se abre ya costeada, con sus líneas y el renglón vacío final.
    await catalog.recipe(GLASEADO.category, GLASEADO.name).click();
    await form.waitReady();
    await expect(grid.materialTotal).toHaveText(GLASEADO.total);
    await expect(grid.costButton(0)).not.toHaveText('＋ precio');
    await expect(grid.rows).toHaveCount(GLASEADO.lineCount + 1);
    await expect(grid.nameInput(GLASEADO.lineCount)).toHaveValue('');
    await expect(grid.removeRowButton(GLASEADO.lineCount)).toHaveCount(0);
    await form.cancel.click();
    await form.waitClosed();
  });

  test('prefijo único → Enter acepta el fantasma y salta a Cantidad → prefijo ambiguo → elegir del desplegable → Escape lo cierra sin elegir → guardar → reabrir conserva los insumos; con teclado se elige la opción activa', async ({
    openCatalog,
    catalog,
    form,
    grid,
    page,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Autocompletado E2E');

    // Una sola coincidencia por prefijo: hay fantasma, Enter lo acepta y el foco salta.
    await grid.acceptGhostName(0, 'Harina');
    await expect(grid.nameInput(0)).toHaveValue(SUPPLIES.harina.name);
    await grid.quantityInput(0).fill('300');

    // Varias coincidencias: se abre el desplegable y se elige con el ratón.
    await grid.nameInput(1).click();
    await grid.nameInput(1).fill('Azúcar');
    await expect(grid.listbox).toBeVisible();
    await expect(grid.options).toHaveCount(3);
    await grid.option(SUPPLIES.azucarBlanca.name).click();
    await expect(grid.nameInput(1)).toHaveValue(SUPPLIES.azucarBlanca.name);
    await grid.quantityInput(1).fill('120');

    // Escape cierra el desplegable sin elegir; lo tecleado se completa a mano.
    await grid.nameInput(2).click();
    await grid.nameInput(2).fill('Azúcar');
    await expect(grid.listbox).toBeVisible();
    await grid.nameInput(2).press('Escape');
    await expect(grid.listbox).toHaveCount(0);
    await grid.nameInput(2).fill(SUPPLIES.huevos.name);
    await grid.quantityInput(2).fill('6');
    await expect(grid.costButton(2)).not.toHaveText('＋ precio');

    await form.save.click();
    await form.waitClosed();

    await catalog.recipe('Queques', 'Autocompletado E2E').click();
    await form.waitReady();
    await expect(grid.nameInput(0)).toHaveValue(SUPPLIES.harina.name);
    await expect(grid.nameInput(1)).toHaveValue(SUPPLIES.azucarBlanca.name);
    await expect(grid.nameInput(2)).toHaveValue(SUPPLIES.huevos.name);
    await form.cancel.click();
    await form.waitClosed();

    /*
     * La elección por teclado va en su propia receta: la flecha marca una de las tres opciones
     * de «Azúcar» y no se sabe cuál, así que meterla en la receta de arriba podría repetir un
     * insumo ya elegido. Aquí el insumo elegido es el único de la línea.
     */
    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Teclado en el desplegable E2E');
    await grid.nameInput(0).click();
    await grid.nameInput(0).fill('Azúcar');
    await expect(grid.listbox).toBeVisible();
    const chosen = await grid.moveActiveOption(0, 'ArrowDown');
    await page.keyboard.press('Enter');
    await expect(grid.nameInput(0)).toHaveValue(chosen);
    await grid.quantityInput(0).fill('80');

    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Rellenos', 'Teclado en el desplegable E2E')).toBeVisible();
  });
});
