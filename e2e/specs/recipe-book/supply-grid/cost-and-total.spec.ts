import { test, expect } from '../../../fixtures/app-fixture';
import { SUPPLIES } from '../../../support/seed';

/**
 * Columna Costo y total de materiales. El cálculo lo hace el negocio
 * (`PreviewRecipeCost`) por regla de tres desde el precio de compra del insumo; la
 * vista solo pinta lo que recibe ya formateado. Los importes esperados salen del seed:
 * harina S/ 4.50 por 1 kg → S/ 0.0045/g; huevos S/ 0.50 por unidad.
 */
test.describe('Grilla de ingredientes · costo y total', () => {
  test('insumo del catálogo con cantidad → la fila muestra su costo y el total lo iguala → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Costo de una línea E2E');

    // 250 g de harina a S/ 0.0045/g = S/ 1.125 → se muestra redondeado.
    await grid.fillExistingLine(0, SUPPLIES.harina.name, '250');
    await expect(grid.costButton(0)).toHaveText('S/ 1.13');
    await expect(grid.materialTotal).toHaveText('S/ 1.13');

    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Costo de una línea E2E')).toBeVisible();
  });

  test('dos insumos → el total suma ambas líneas → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Costo de dos líneas E2E');

    await grid.fillExistingLine(0, SUPPLIES.harina.name, '1000'); // S/ 4.50
    await grid.fillExistingLine(1, SUPPLIES.huevos.name, '3'); // S/ 1.50
    await expect(grid.costButton(0)).toHaveText('S/ 4.50');
    await expect(grid.costButton(1)).toHaveText('S/ 1.50');
    await expect(grid.materialTotal).toHaveText('S/ 6.00');

    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Costo de dos líneas E2E')).toBeVisible();
  });

  test('cambiar la cantidad → el costo y el total se recalculan → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Recalculo E2E');

    await grid.fillExistingLine(0, SUPPLIES.huevos.name, '2');
    await expect(grid.costButton(0)).toHaveText('S/ 1.00');

    await grid.quantityInput(0).fill('10');
    await expect(grid.costButton(0)).toHaveText('S/ 5.00');
    await expect(grid.materialTotal).toHaveText('S/ 5.00');

    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Recalculo E2E')).toBeVisible();
  });

  test('la unidad la dicta el precio del insumo: masa muestra g y conteo muestra u → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Unidades por familia E2E');

    await grid.fillExistingLine(0, SUPPLIES.harina.name, '200');
    await grid.fillExistingLine(1, SUPPLIES.huevos.name, '4');

    expect(await grid.unitOf(0)).toBe('g');
    expect(await grid.unitOf(1)).toBe('u');

    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Unidades por familia E2E')).toBeVisible();
  });

  test('receta sembrada → sus costos y total ya vienen calculados al abrirla → cerrar', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    await catalog.recipe('Coberturas', 'Glaseado de Queso Crema').click();
    await form.waitReady();

    await expect(grid.materialTotal).toHaveText('S/ 28.80');
    await expect(grid.costButton(0)).not.toHaveText('＋ precio');

    await form.cancel.click();
    await form.waitClosed();
  });

  test('grilla vacía → no se pinta el total de materiales → escribir una línea → aparece', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();

    await expect(grid.materialTotalLabel).toHaveCount(0);

    await grid.fillExistingLine(0, SUPPLIES.harina.name, '100');
    await expect(grid.materialTotalLabel).toBeVisible();
    await expect(grid.materialTotal).toHaveText('S/ 0.45');

    await form.cancel.click();
    await form.waitClosed();
  });
});
