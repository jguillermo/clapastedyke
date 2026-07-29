import { test, expect } from '../../../fixtures/app-fixture';
import { SUPPLY_COUNT } from '../../../support/seed';

/**
 * Sección de **Insumos** del libro 3D (la última): ahí el botón flotante primario deja de ser
 * `＋ Nuevo «Categoría»` y pasa a ser `Gestionar insumos`, que abre el diálogo de la hoja editable.
 *
 * Llegar hasta ella cuesta varios volteos, así que el page object encola los pulsos
 * (`goToSuppliesSection`) y detecta la sección por su propio botón flotante.
 */
test.describe('Libro 3D · sección de Insumos', () => {
  test.use({ webgl: true });

  test('avanzar hasta Insumos → el botón flotante pasa a Gestionar insumos (ya no Nuevo)', async ({
    openBook3d,
    book,
  }) => {
    await openBook3d();

    await book.goToSuppliesSection();

    await expect(book.manageSupplies).toBeVisible();
    await expect(book.newRecipe).toHaveCount(0);
  });

  test('Insumos → Gestionar insumos → la hoja editable lista el catálogo → cerrar → vuelve el libro', async ({
    openBook3d,
    book,
    supplies,
  }) => {
    await openBook3d();
    await book.goToSuppliesSection();

    await book.manageSupplies.click();
    await supplies.waitReady();
    await expect(supplies.list.rows).toHaveCount(SUPPLY_COUNT + 1);

    await supplies.close.click();
    await supplies.waitClosed();
    await expect(book.pager).toBeVisible();
    await expect(book.manageSupplies).toBeVisible();
  });

  test('Insumos → agregar un insumo → cerrar → el libro recarga y el insumo persiste', async ({
    openBook3d,
    book,
    supplies,
  }) => {
    await openBook3d();
    await book.goToSuppliesSection();

    await book.manageSupplies.click();
    await supplies.waitReady();
    await supplies.list.addSupply('Grageas de color E2E', '80', '6');
    await supplies.close.click();
    await supplies.waitClosed();

    // El libro recargó el catálogo: al reabrir el diálogo el insumo sigue ahí.
    await expect(book.manageSupplies).toBeVisible();
    await book.manageSupplies.click();
    await supplies.waitReady();
    expect(await supplies.list.names()).toContain('Grageas de color E2E');

    await supplies.close.click();
    await supplies.waitClosed();
  });

  test('el índice no lista la sección de Insumos', async ({ openBook3d, book }) => {
    await openBook3d();

    await book.indexToggle.click();
    await expect(book.indexPanel).toBeVisible();
    await expect(book.indexPanel.getByText('Insumos', { exact: true })).toHaveCount(0);

    await book.indexClose.click();
    await expect(book.indexPanel).toHaveCount(0);
  });
});
