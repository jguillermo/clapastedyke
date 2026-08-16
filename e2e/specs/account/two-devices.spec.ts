import { test, expect } from '../../fixtures/app-fixture';
import type { AccountPage } from '../../pages/account.page';
import type { HomePage } from '../../pages/home.page';
import type { RecipeBookFallbackPage } from '../../pages/recipe-book-fallback.page';
import type { SuppliesDialogPage } from '../../pages/supplies-dialog.page';
import { RECIPES, SUPPLIES, SUPPLY_COUNT } from '../../support/seed';

/**
 * **Dos aparatos, una hoja.** Es la prueba que de verdad dice si sincronizar sirve para algo.
 *
 * Todo lo demás se puede fingir desde un solo navegador —editar la hoja a mano imita bastante bien al
 * otro aparato— pero hay dos cosas que no se pueden fingir, y son justo las que rompieron:
 *
 * 1. **Cada aparato tiene su propia identidad**, y por tanto su propio reloj y su propio origen.
 * 2. **Cada aparato siembra su propio catálogo de fábrica**, con los mismos ids fijos que el otro.
 *
 * Del cruce de esas dos salió la pérdida de datos: el segundo navegador sellaba su catálogo de fábrica
 * con la hora de arranque —la fecha más reciente del sistema—, sus filas se emparejaban por id con las
 * de la hoja y **le ganaban**. El trabajo del primero desaparecía en la primera sincronización del
 * segundo, sin un aviso.
 *
 * Aquí se recorre el ciclo completo entre los dos, en las dos direcciones y con el catálogo sembrado
 * de por medio, hasta que los dos ven exactamente lo mismo.
 */

/** `/cuenta` → cocina → libro de recetas, por navegación de la app (sin recargar). */
async function openBook(
  account: AccountPage,
  home: HomePage,
  catalog: RecipeBookFallbackPage,
): Promise<void> {
  await account.backToKitchen.click();
  await expect(home.dock).toBeVisible();
  await home.station('Libro de recetas').click();
  await catalog.waitReady();
}

/** El camino de vuelta: libro → cocina → `/cuenta`. */
async function backToAccount(
  catalog: RecipeBookFallbackPage,
  home: HomePage,
  account: AccountPage,
): Promise<void> {
  await catalog.back.click();
  await expect(home.dock).toBeVisible();
  await home.accountLink.click();
  await expect(account.root).toBeVisible();
}

/** Y del libro al diálogo de Insumos. */
async function openSupplies(
  catalog: RecipeBookFallbackPage,
  supplies: SuppliesDialogPage,
): Promise<void> {
  await catalog.suppliesButton.click();
  await supplies.waitReady();
}

/** Sincroniza y espera a que el aparato lo dé por terminado. */
async function sync(account: AccountPage): Promise<void> {
  await account.syncAll.click();
  await expect(account.statusLabel).toHaveText('Al día');
}

test.describe('Cuenta · dos aparatos contra la misma hoja', () => {
  test('el primero sube su catálogo → el segundo se une sin pisarlo → cada uno crea un insumo → los dos acaban viendo lo mismo', async ({
    google,
    connectAccount,
    account,
    home,
    catalog,
    supplies,
    secondDevice,
  }) => {
    // ── El primer aparato: conecta, crea la hoja y sube su catálogo ──────────────────────────────
    await connectAccount();
    await sync(account);

    const insumos = google.sheet.tab('ingredients');
    await expect.poll(() => insumos.dataRowCount, { timeout: 20_000 }).toBe(SUPPLY_COUNT);

    // Y le pone precio propio a un insumo sembrado: es el dato que el segundo aparato NO puede pisar,
    // porque su copia de fábrica de esa misma fila tiene el precio original.
    await openBook(account, home, catalog);
    await openSupplies(catalog, supplies);
    const harinaRow = await supplies.list.rowOf(SUPPLIES.harina.name);
    await supplies.list.priceInput(harinaRow).fill('99.90');
    await supplies.list.priceInput(harinaRow).press('Enter');
    await supplies.list.addSupply('Manteca del primero', '500', '9.90');
    await supplies.close.click();
    await supplies.waitClosed();
    await backToAccount(catalog, home, account);
    await sync(account);

    await expect.poll(() => insumos.dataRowCount, { timeout: 20_000 }).toBe(SUPPLY_COUNT + 1);

    // ── El segundo aparato: base vacía, siembra su catálogo de fábrica, y se une a la hoja ───────
    // Este es el momento exacto en el que se perdían los datos.
    await secondDevice.account.goto();
    await secondDevice.account.connectAndWait();
    await sync(secondDevice.account);

    // La hoja no ha crecido: los ids del seed son fijos, así que las filas del segundo son las mismas
    // que ya estaban. Si se hubieran duplicado, el catálogo tendría cada insumo dos veces.
    await expect.poll(() => insumos.dataRowCount, { timeout: 20_000 }).toBe(SUPPLY_COUNT + 1);

    // Y lo del primero llega entero: el insumo que creó y el precio que corrigió sobre una fila que el
    // segundo también tenía sembrada. Ese precio es el que antes se perdía.
    await openBook(secondDevice.account, secondDevice.home, secondDevice.catalog);
    await openSupplies(secondDevice.catalog, secondDevice.supplies);
    const enElSegundo = await secondDevice.supplies.list.names();
    expect(enElSegundo).toContain('Manteca del primero');
    await expect(
      secondDevice.supplies.list.priceInput(
        await secondDevice.supplies.list.rowOf(SUPPLIES.harina.name),
      ),
    ).toHaveValue('99.9');

    // ── El segundo crea lo suyo, y vuelve al primero ─────────────────────────────────────────────
    await secondDevice.supplies.list.addSupply('Coco del segundo', '250', '7.50');
    await secondDevice.supplies.close.click();
    await secondDevice.supplies.waitClosed();
    await backToAccount(secondDevice.catalog, secondDevice.home, secondDevice.account);
    await sync(secondDevice.account);

    await expect.poll(() => insumos.dataRowCount, { timeout: 20_000 }).toBe(SUPPLY_COUNT + 2);

    await sync(account);
    await openBook(account, home, catalog);
    await openSupplies(catalog, supplies);
    // Sin la fila vacía de «añadir», que siempre está al final de la lista.
    const enElPrimero = (await supplies.list.names()).filter((name) => name.length > 0);

    // ── El estado terminal: los dos ven lo mismo, y es todo ──────────────────────────────────────
    expect(enElPrimero).toContain('Coco del segundo');
    expect(enElPrimero).toContain('Manteca del primero');
    await expect(
      supplies.list.priceInput(await supplies.list.rowOf(SUPPLIES.harina.name)),
    ).toHaveValue('99.9');
    // Ni uno más ni uno menos: el catálogo sembrado más lo que creó cada aparato. Que no sobre nada es
    // tan importante como que no falte — un catálogo duplicado también es sincronización rota.
    expect(enElPrimero).toHaveLength(SUPPLY_COUNT + 2);
    expect(new Set(enElPrimero).size).toBe(enElPrimero.length);
  });

  /**
   * **La receta, que es donde de verdad dolió.**
   *
   * Los dos aparatos siembran la misma receta de fábrica, con el mismo id. El primero la cambia —le
   * añade un ingrediente y la renombra— y sincroniza. Cuando el segundo sincroniza, su copia de esa
   * receta tiene que **bajar** de la hoja y quedar como la dejó el primero.
   *
   * Ese es exactamente el ingrediente que se perdía: no desaparecía del catálogo, desaparecía **de
   * dentro de una receta**. La copia de fábrica del segundo aparato tenía la receta con sus líneas
   * originales y le ganaba por fecha, así que la línea añadida se iba con ella — en la hoja y en los
   * dos aparatos a la vez.
   *
   * El journey empieza con los dos ya sincronizados y comprueba el **antes** en el segundo: sin eso, un
   * test que solo mirara el después no distinguiría «bajó el cambio» de «siempre estuvo así».
   */
  test('los dos siembran la misma receta → el primero le añade un ingrediente y la renombra → el segundo sincroniza y la recibe entera', async ({
    connectAccount,
    account,
    home,
    catalog,
    form,
    grid,
    secondDevice,
  }) => {
    const RENOMBRADA = 'Manjar Blanco del primero';

    // ── El primero: conecta, sube su catálogo, y cambia la receta ────────────────────────────────
    await connectAccount();
    await sync(account);

    await openBook(account, home, catalog);
    await catalog.recipe('Rellenos', 'Manjar Blanco').click();
    await form.waitReady();
    await form.name.fill(RENOMBRADA);
    await grid.fillExistingLine(1, SUPPLIES.huevos.name, '4');
    await form.save.click();
    await form.waitClosed();
    await backToAccount(catalog, home, account);
    await sync(account);

    // ── El segundo aparato, que NO se ha sincronizado nunca ──────────────────────────────────────
    // El orden importa y es todo el test: llega con su receta de fábrica intacta y se encuentra la
    // misma receta —mismo id— ya cambiada en la hoja. Aquí es donde su copia de fábrica ganaba.
    await secondDevice.home.goto();
    await secondDevice.home.station('Libro de recetas').click();
    await secondDevice.catalog.waitReady();

    // El antes: su receta de fábrica, con la única línea que trae el seed.
    expect(await secondDevice.catalog.recipeNamesIn('Rellenos')).toContain('Manjar Blanco');
    await secondDevice.catalog.recipe('Rellenos', 'Manjar Blanco').click();
    await secondDevice.form.waitReady();
    await expect(secondDevice.grid.nameInput(1)).toHaveValue('');
    await secondDevice.form.cancel.click();
    await secondDevice.form.waitClosed();

    // ── Conecta y sincroniza: la receta baja y se queda como la dejó el primero ──────────────────
    await backToAccount(secondDevice.catalog, secondDevice.home, secondDevice.account);
    await secondDevice.account.connectAndWait();
    await sync(secondDevice.account);
    await openBook(secondDevice.account, secondDevice.home, secondDevice.catalog);

    const enRellenos = await secondDevice.catalog.recipeNamesIn('Rellenos');
    expect(enRellenos).toContain(RENOMBRADA);
    // Renombrar no duplica: es la misma receta con otro nombre, no una nueva.
    expect(enRellenos).not.toContain('Manjar Blanco');
    expect(enRellenos).toHaveLength(RECIPES.Rellenos.length);

    // Y por dentro, el ingrediente que añadió el primero: es la línea que se perdía.
    await secondDevice.catalog.recipe('Rellenos', RENOMBRADA).click();
    await secondDevice.form.waitReady();
    await expect(secondDevice.form.name).toHaveValue(RENOMBRADA);
    await expect(secondDevice.grid.nameInput(1)).toHaveValue(SUPPLIES.huevos.name);
    await expect(secondDevice.grid.quantityInput(1)).toHaveValue('4');
    await secondDevice.form.cancel.click();
    await secondDevice.form.waitClosed();
  });
});
