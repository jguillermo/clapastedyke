import { test, expect } from '../../../fixtures/app-fixture';
import { SUPPLY_COUNT } from '../../../support/seed';

/**
 * Shell del diálogo de Insumos (`features/recipe-book/supplies-dialog`), abierto desde el botón
 * `Insumos` del libro: solo aporta cabecera + cuerpo con la lista editable, y al cerrar devuelve
 * si hubo cambios para que el libro recargue.
 *
 * Un único journey recorre sus tres salidas (×, backdrop, Escape) y termina donde de verdad se
 * nota que el libro recargó: el insumo nuevo ya costea una receta.
 */
test.describe('Diálogo de Insumos', () => {
  test('libro → Insumos lista el catálogo → × → backdrop → Escape devuelve a la cocina sin tocar nada → agregar un insumo → cerrar → el libro recarga y ya lo costea en una receta', async ({
    openSuppliesDialog,
    supplies,
    catalog,
    form,
    grid,
    home,
    page,
  }) => {
    await openSuppliesDialog();

    // El renglón de agregar va arriba, así que hay un renglón más que insumos sembrados.
    await expect(supplies.title).toHaveText('Insumos');
    await expect(supplies.list.rows).toHaveCount(SUPPLY_COUNT + 1);
    await expect(supplies.list.hint).toBeVisible();
    await expect(supplies.list.columnHeaders).toHaveText([
      'Insumo',
      'Empaque',
      'Precio',
      'Acciones',
    ]);

    // Salida 1: la × de la cabecera. Sin cambios, el libro conserva sus recetas.
    await supplies.close.click();
    await supplies.waitClosed();
    await expect(catalog.suppliesButton).toBeEnabled();
    await expect(catalog.categoryHeadings).toHaveCount(3);
    await expect(catalog.recipe('Queques', 'Keke de Chocolate')).toBeVisible();

    // Salida 2: clic en el backdrop, fuera del panel.
    await catalog.suppliesButton.click();
    await supplies.waitReady();
    await supplies.closeByBackdrop();
    await supplies.waitClosed();
    await expect(catalog.suppliesButton).toBeEnabled();

    /*
     * Salida 3 — OJO, comportamiento actual: Escape cierra el diálogo **y además el libro**,
     * devolviendo al usuario a la cocina. El atajo del libro (`document:keydown`) corre en el
     * mismo evento en el que el CDK ya cerró el diálogo, así que su guarda `dialogOpen` ya vale
     * `false` y también actúa. Se recorre el flujo real hasta el terminal que importa: el
     * catálogo de insumos quedó intacto.
     */
    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const before = await supplies.list.names();
    await page.keyboard.press('Escape');
    await supplies.waitClosed();

    await expect(home.dock).toBeVisible();
    await home.station('Libro de recetas').click();
    await catalog.waitReady();
    await catalog.suppliesButton.click();
    await supplies.waitReady();
    expect(await supplies.list.names()).toEqual(before);

    // Estado terminal: con un insumo nuevo, el libro recarga y la receta lo costea sin pedir precio.
    await supplies.list.addSupply('Cacao amargo E2E', '250', '12');
    await supplies.close.click();
    await supplies.waitClosed();

    await catalog.newRecipeIn('Coberturas').click();
    await form.waitReady();
    await form.name.fill('Con cacao del catálogo E2E');
    await grid.fillExistingLine(0, 'Cacao amargo E2E', '100');
    await expect(grid.costButton(0)).toHaveText('S/ 4.80');
    await form.save.click();
    await form.waitClosed();

    await expect(catalog.recipe('Coberturas', 'Con cacao del catálogo E2E')).toBeVisible();
  });
});
