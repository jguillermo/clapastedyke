import { test, expect } from '../../fixtures/app-fixture';
import type { AccountPage } from '../../pages/account.page';
import type { HomePage } from '../../pages/home.page';
import type { RecipeBookFallbackPage } from '../../pages/recipe-book-fallback.page';
import type { SuppliesDialogPage } from '../../pages/supplies-dialog.page';
import { SUPPLIES } from '../../support/seed';

/**
 * **Dos cambios a la vez, en campos distintos del mismo insumo, y sobreviven los dos.**
 *
 * Es la capacidad que trae el motor nuevo y la única razón de peso para haberlo cambiado. Antes ganaba
 * un lado entero: quien renombrara un insumo aquí mientras otra persona le corregía el precio en la
 * hoja perdía uno de los dos cambios, **sin aviso y sin forma de saber cuál**.
 *
 * Lo que lo hace posible es el **ancestro**: la base guarda los valores de la última fila remota
 * conocida, no solo su huella, así que se puede saber *quién* cambió *qué* en vez de solo que algo
 * cambió. Con eso, el precio se atribuye a la hoja, el nombre a la app, y se combinan.
 *
 * El caso se monta con el precio en la hoja y el nombre en la app **a propósito**: son los dos campos
 * que de verdad edita la gente, y viven en sitios distintos del documento —el precio va anidado dentro
 * de `purchasePrice`, el nombre es un campo suelto— así que además prueba que la fusión funciona a
 * través del aplanado.
 */

/** Cocina → libro → diálogo de Insumos, por navegación de la app (sin recargar: un solo arranque). */
async function openSupplies(
  account: AccountPage,
  home: HomePage,
  catalog: RecipeBookFallbackPage,
  supplies: SuppliesDialogPage,
): Promise<void> {
  await account.backToKitchen.click();
  await expect(home.dock).toBeVisible();
  await home.station('Libro de recetas').click();
  await catalog.waitReady();
  await catalog.suppliesButton.click();
  await supplies.waitReady();
}

/** El camino de vuelta: diálogo → libro → cocina → `/cuenta`. */
async function backToAccount(
  supplies: SuppliesDialogPage,
  catalog: RecipeBookFallbackPage,
  home: HomePage,
  account: AccountPage,
): Promise<void> {
  await supplies.close.click();
  await supplies.waitClosed();
  await catalog.back.click();
  await expect(home.dock).toBeVisible();
  await home.accountLink.click();
  await expect(account.root).toBeVisible();
}

test.describe('Cuenta · fusión de campos', () => {
  test('renombrar aquí y repreciar en la hoja a la vez → sincronizar → sobreviven los dos cambios, aquí y allí', async ({
    google,
    connectAccount,
    account,
    home,
    catalog,
    supplies,
  }) => {
    await connectAccount();
    const insumos = google.sheet.tab('ingredients');
    const harina = insumos.rowOf('id', SUPPLIES.harina.id);

    // ── El cambio de la hoja: alguien corrige el precio ───────────────────────────────────────────
    // Se toca SOLO la celda del precio, como haría una persona: ni la versión ni la huella. Esa
    // discrepancia es lo que delata que la fila la editó alguien.
    insumos.setCell(harina, 'purchasePrice.amount', '7.25');

    // ── El cambio de la app: aquí se renombra el mismo insumo ────────────────────────────────────
    await openSupplies(account, home, catalog, supplies);
    const fila = await supplies.list.rowOf(SUPPLIES.harina.name);
    expect(fila).toBeGreaterThan(0);
    await supplies.list.nameInput(fila).fill('Harina fusionada');
    // El renglón se guarda al salir de él: sin esto el cambio se queda en el input y no persiste.
    await supplies.list.blurRow(fila);
    await backToAccount(supplies, catalog, home, account);

    await account.syncAll.click();
    await expect(account.statusLabel).toHaveText('Al día');

    // ── Los dos cambios, en los dos lados ────────────────────────────────────────────────────────
    // En la hoja: el nombre que se puso aquí y el precio que se puso allí, en la misma fila.
    await expect
      .poll(() => insumos.cell(harina, 'name'), { timeout: 20_000 })
      .toBe('Harina fusionada');
    expect(insumos.cell(harina, 'purchasePrice.amount')).toBe(7.25);

    // Y en la app, lo mismo: el precio de la hoja no se perdió al subir el nombre.
    await openSupplies(account, home, catalog, supplies);
    const fusionada = await supplies.list.rowOf('Harina fusionada');
    expect(fusionada).toBeGreaterThan(0);
    await expect(supplies.list.priceInput(fusionada)).toHaveValue('7.25');
  });
});
