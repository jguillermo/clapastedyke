import { test, expect } from '../../../fixtures/app-fixture';
import { SUPPLY_COUNT } from '../../../support/seed';

/**
 * Shell del diálogo de Insumos (`features/recipe-book/supplies-dialog`), abierto desde el botón
 * `Insumos` del libro. Solo aporta cabecera + cuerpo con la lista editable, y al cerrar devuelve si
 * hubo cambios para que el libro recargue.
 *
 * Estado terminal de todos estos caminos: el diálogo desmontado y el libro operable otra vez.
 */
test.describe('Diálogo de Insumos · abrir y cerrar', () => {
  test('libro → Insumos → el diálogo lista el catálogo sembrado → × → vuelve el libro operable', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();

    await expect(supplies.title).toHaveText('Insumos');
    // El renglón de agregar va arriba, así que hay un renglón más que insumos sembrados.
    await expect(supplies.list.rows).toHaveCount(SUPPLY_COUNT + 1);

    await supplies.close.click();

    await supplies.waitClosed();
    await expect(catalog.suppliesButton).toBeEnabled();
    await expect(catalog.categoryHeadings.first()).toBeVisible();
  });

  /**
   * OJO — comportamiento actual: Escape cierra el diálogo **y además el libro**, devolviendo al
   * usuario a la cocina. El atajo del libro (`document:keydown`) corre en el mismo evento en el que
   * el CDK ya cerró el diálogo, así que su guarda `dialogOpen` ya vale `false` y también actúa (lo
   * mismo pasa con el formulario de receta). Se recorre el flujo real hasta el terminal que importa:
   * el catálogo de insumos quedó intacto.
   */
  test('diálogo abierto → Escape → vuelve la cocina → reabrir el libro y los insumos → sigue igual', async ({
    openSuppliesDialog,
    supplies,
    catalog,
    home,
    page,
  }) => {
    await openSuppliesDialog();
    const before = await supplies.list.names();

    await page.keyboard.press('Escape');
    await supplies.waitClosed();

    await expect(home.dock).toBeVisible();
    await home.station('Libro de recetas').click();
    await catalog.waitReady();
    await catalog.suppliesButton.click();
    await supplies.waitReady();
    expect(await supplies.list.names()).toEqual(before);

    await supplies.close.click();
    await supplies.waitClosed();
  });

  test('diálogo abierto → clic en el backdrop, fuera del panel → se cierra y vuelve el libro', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();

    await supplies.closeByBackdrop();

    await supplies.waitClosed();
    await expect(catalog.suppliesButton).toBeEnabled();
    await expect(catalog.categoryHeadings.first()).toBeVisible();
  });

  test('sin cambios → cerrar → el libro conserva sus recetas (no hubo recarga con datos nuevos)', async ({
    openSuppliesDialog,
    supplies,
    catalog,
  }) => {
    await openSuppliesDialog();

    await supplies.close.click();
    await supplies.waitClosed();

    await expect(catalog.categoryHeadings).toHaveCount(3);
    await expect(catalog.recipe('Queques', 'Keke de Chocolate')).toBeVisible();
  });

  test('agregar un insumo → cerrar → el libro recarga y el insumo ya está disponible en una receta', async ({
    openSuppliesDialog,
    supplies,
    catalog,
    form,
    grid,
  }) => {
    await openSuppliesDialog();

    await supplies.list.addSupply('Cacao amargo E2E', '250', '12');
    await supplies.close.click();
    await supplies.waitClosed();

    // Estado terminal: el insumo nuevo ya tiene precio en el catálogo, así que una receta lo
    // costea sin pedir «＋ precio».
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
