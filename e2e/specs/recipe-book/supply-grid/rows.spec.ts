import { test, expect } from '../../../fixtures/app-fixture';
import { SUPPLIES } from '../../../support/seed';

/**
 * Gestión de filas de la grilla: siempre hay un renglón vacío al final (se añade uno
 * nuevo al escribir en el último), y cada fila llena ofrece su botón de quitar. La
 * última fila —la vacía— no lo ofrece.
 */
test.describe('Grilla de ingredientes · filas', () => {
  test('grilla nueva → arranca con un único renglón vacío y su cabecera de 4 columnas', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();

    await expect(grid.rows).toHaveCount(1);
    await expect(grid.columnHeaders).toHaveText(['Ingrediente', 'Cantidad', 'Costo', '']);
    await expect(grid.nameInput(0)).toHaveValue('');

    await form.cancel.click();
    await form.waitClosed();
  });

  test('escribir en el último renglón → se añade otro vacío debajo → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Renglón al vuelo E2E');

    await expect(grid.rows).toHaveCount(1);
    await grid.fillExistingLine(0, SUPPLIES.harina.name, '100');
    await expect(grid.rows).toHaveCount(2);

    await grid.fillExistingLine(1, SUPPLIES.huevos.name, '1');
    await expect(grid.rows).toHaveCount(3);

    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Renglón al vuelo E2E')).toBeVisible();
  });

  test('el renglón vacío final no ofrece quitar fila; los llenos sí', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();

    await expect(grid.removeRowButton(0)).toHaveCount(0);

    await grid.fillExistingLine(0, SUPPLIES.harina.name, '100');
    await expect(grid.removeRowButton(0)).toBeVisible();
    await expect(grid.removeRowButton(1)).toHaveCount(0);

    await form.cancel.click();
    await form.waitClosed();
  });

  test('quitar una fila del medio → las de abajo suben y el total se recalcula → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Quitar del medio E2E');

    await grid.fillExistingLine(0, SUPPLIES.harina.name, '1000'); // S/ 4.50
    await grid.fillExistingLine(1, SUPPLIES.huevos.name, '2'); // S/ 1.00
    await grid.fillExistingLine(2, SUPPLIES.azucarImpalpable.name, '500'); // S/ 5.50
    await expect(grid.materialTotal).toHaveText('S/ 11.00');

    await grid.removeRowButton(1).click();

    await expect(grid.nameInput(1)).toHaveValue(SUPPLIES.azucarImpalpable.name);
    await expect(grid.materialTotal).toHaveText('S/ 10.00');

    await form.save.click();
    await form.waitClosed();

    await catalog.recipe('Queques', 'Quitar del medio E2E').click();
    await form.waitReady();
    await expect(grid.nameInput(0)).toHaveValue(SUPPLIES.harina.name);
    await expect(grid.nameInput(1)).toHaveValue(SUPPLIES.azucarImpalpable.name);
    await expect(grid.rows).toHaveCount(3); // dos líneas + el renglón vacío
  });

  test('quitar todas las filas llenas → queda un renglón vacío → Guardar avisa que falta un ingrediente → añadir uno → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Vaciar y rellenar E2E');

    await grid.fillExistingLine(0, SUPPLIES.harina.name, '100');
    await grid.removeRowButton(0).click();
    await expect(grid.rows).toHaveCount(1);
    await expect(grid.nameInput(0)).toHaveValue('');

    await form.save.click();
    await expect(grid.error).toHaveText('Agrega al menos un ingrediente.');

    await grid.fillExistingLine(0, SUPPLIES.huevos.name, '2');
    await form.save.click();
    await form.waitClosed();

    await expect(catalog.recipe('Queques', 'Vaciar y rellenar E2E')).toBeVisible();
  });

  test('receta sembrada de varias líneas → se precargan todas más el renglón vacío → cerrar', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    await catalog.recipe('Coberturas', 'Glaseado de Queso Crema').click();
    await form.waitReady();

    // El seed trae 4 líneas para esta receta; la grilla añade el renglón vacío final.
    await expect(grid.rows).toHaveCount(5);
    await expect(grid.nameInput(4)).toHaveValue('');
    await expect(grid.removeRowButton(4)).toHaveCount(0);

    await form.cancel.click();
    await form.waitClosed();
  });
});
