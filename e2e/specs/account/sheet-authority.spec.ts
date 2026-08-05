import { test, expect } from '../../fixtures/app-fixture';
import type { AccountPage } from '../../pages/account.page';
import type { HomePage } from '../../pages/home.page';
import type { RecipeBookFallbackPage } from '../../pages/recipe-book-fallback.page';
import type { SuppliesDialogPage } from '../../pages/supplies-dialog.page';
import { SUPPLIES, SUPPLY_COUNT } from '../../support/seed';

/**
 * La hoja manda: lo que se cambia **a mano en la hoja** llega a la app.
 *
 * Es el requisito que da nombre a todo el diseño («Google Sheets es siempre la fuente de la verdad») y
 * el único que no se puede comprobar sin una hoja detrás: hay que editar una celda como lo haría una
 * persona —sin tocar la versión ni la huella, que es justo lo que la convierte en edición manual— y ver
 * el dato aparecer en la vista.
 *
 * Se recorren las tres formas en que la hoja puede mandar, que son tres mecanismos distintos:
 *
 * | En la hoja | En la app |
 * |---|---|
 * | se cambia una celda | el insumo cambia (la huella recalculada no cuadra con la escrita ⇒ gana la hoja) |
 * | se marca `borrado` | el insumo desaparece (lápida) |
 * | se borra la fila entera | el insumo desaparece (estaba en la base y ya no está en la hoja) |
 * | se añade una fila **sin id** | se adopta: entra en la app y la hoja recibe su id, huella y versión |
 * | se le **cambia el id** a una fila | se le devuelve el suyo (de él depende la integridad referencial) |
 *
 * Los insumos que este journey **borra** son los que él mismo ha creado. Borrar uno sembrado dejaría
 * recetas apuntando a un insumo que no está, y el test acabaría comprobando qué hace la vista con una
 * referencia colgada en vez de la sincronización.
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

/** Un ciclo completo a mano, y se espera a que termine bien. */
async function sync(account: AccountPage): Promise<void> {
  await account.syncAll.click();
  await expect(account.statusLabel).toHaveText('Al día');
}

test.describe('Cuenta · la hoja es la fuente de la verdad', () => {
  test('insumos creados aquí suben a la hoja → editados a mano allí bajan a la app → marcado como borrado y fila eliminada desaparecen de aquí → una fila sin id se adopta → un id cambiado a mano vuelve a su sitio', async ({
    google,
    connectAccount,
    account,
    home,
    catalog,
    supplies,
  }) => {
    await connectAccount();
    // La misma referencia durante todo el journey: el doble muta la pestaña, no la reemplaza.
    const insumos = google.sheet.tab('Insumos');

    // ── Caso 1 · lo que se crea aquí acaba en la hoja ────────────────────────────────────────────
    await openSupplies(account, home, catalog, supplies);
    await supplies.list.addSupply('Manteca E2E', '500', '9.90');
    await supplies.list.addSupply('Coco E2E', '250', '7.50');
    await backToAccount(supplies, catalog, home, account);
    await sync(account);

    // Se espera por la cuenta en vez de leerla de golpe: el rebote de cinco segundos pudo lanzar su
    // propio ciclo mientras se navegaba, y entonces el ciclo que se pide aquí se une a ése —que leyó lo
    // local antes del segundo alta— y es el siguiente el que lo sube. Converge igual; solo hay que
    // dejarle llegar.
    await expect.poll(() => insumos.dataRowCount, { timeout: 20_000 }).toBe(SUPPLY_COUNT + 2);

    const manteca = insumos.rowOf('Nombre', 'Manteca E2E');
    expect(manteca).toBeGreaterThan(1);
    expect(insumos.rowOf('Nombre', 'Coco E2E')).toBeGreaterThan(1);
    expect(insumos.cell(manteca, 'Precio de compra')).toBe(9.9);
    expect(insumos.cell(manteca, 'Presentación (cantidad)')).toBe(500);
    expect(insumos.cell(manteca, 'Presentación (unidad)')).toBe('g');

    // ── Caso 2 · dos ediciones a mano en la hoja, y la app se pone al día ────────────────────────
    // Se toca SOLO la celda del dato, como haría una persona: ni la versión ni la huella. Es esa
    // discrepancia —la huella escrita ya no cuadra con el contenido— la que hace que la hoja gane.
    const harina = insumos.rowOf('id', SUPPLIES.harina.id);
    insumos.setCell(harina, 'Nombre', 'Harina E2E');
    insumos.setCell(manteca, 'Precio de compra', '12.5');

    await sync(account);

    await openSupplies(account, home, catalog, supplies);
    const names = await supplies.list.names();
    expect(names).toContain('Harina E2E');
    expect(names).not.toContain(SUPPLIES.harina.name);
    const mantecaRow = await supplies.list.rowOf('Manteca E2E');
    expect(mantecaRow).toBeGreaterThan(0);
    await expect(supplies.list.priceInput(mantecaRow)).toHaveValue('12.5');

    // Leer la hoja no la reescribe: la corrección de quien la editó se queda tal cual.
    expect(insumos.cell(harina, 'Nombre')).toBe('Harina E2E');

    // ── Caso 3 · borrar en la hoja, de las dos formas posibles, borra aquí ───────────────────────
    await backToAccount(supplies, catalog, home, account);

    // Una lápida (así la escribe la app) y una fila que simplemente desaparece.
    insumos.setCell(insumos.rowOf('Nombre', 'Manteca E2E'), 'borrado', 'TRUE');
    insumos.deleteRow(insumos.rowOf('Nombre', 'Coco E2E'));

    await sync(account);

    await openSupplies(account, home, catalog, supplies);
    const survivors = await supplies.list.names();
    expect(survivors).not.toContain('Manteca E2E');
    expect(survivors).not.toContain('Coco E2E');
    // Y lo demás sigue donde estaba: el borrado alcanzó a dos filas, no a la tabla.
    expect(survivors).toContain('Harina E2E');
    expect(survivors).toContain(SUPPLIES.huevos.name);
    // La lista trae además un renglón vacío para agregar, de ahí el +1.
    expect(survivors).toHaveLength(SUPPLY_COUNT + 1);

    // ── Caso 4 · una fila escrita a mano SIN id se adopta ────────────────────────────────────────
    await backToAccount(supplies, catalog, home, account);
    const nueva = insumos.appendRow({
      Nombre: 'Cardamomo E2E',
      'Unidad base': 'g',
      Uso: 'recipe',
      'Precio de compra': '18',
      'Presentación (cantidad)': '100',
      'Presentación (unidad)': 'g',
      Moneda: 'PEN',
    });

    await sync(account);

    // El motor le pone identidad, huella y versión **en su propia fila**: sin eso, el ciclo siguiente le
    // inventaría otra identidad y crearía un insumo nuevo cada dos minutos.
    const adoptado = String(insumos.cell(nueva, 'id'));
    expect(adoptado).not.toBe('');
    expect(String(insumos.cell(nueva, 'huella'))).not.toBe('');
    expect(String(insumos.cell(nueva, 'version'))).not.toBe('');
    expect(insumos.cell(nueva, 'Nombre')).toBe('Cardamomo E2E');

    await openSupplies(account, home, catalog, supplies);
    expect(await supplies.list.names()).toContain('Cardamomo E2E');

    // ── Caso 5 · un id cambiado a mano se devuelve a su sitio ────────────────────────────────────
    // Es el desenlace más silencioso: el id viejo «desaparece» y el nuevo parece un alta, dejando
    // colgando todo lo que citaba al viejo mientras la hoja parece perfecta.
    await backToAccount(supplies, catalog, home, account);
    insumos.setCell(nueva, 'id', 'id-cambiado-a-mano');

    await sync(account);

    expect(insumos.cell(nueva, 'id')).toBe(adoptado);
    // Y no se dio por borrado por haber «desaparecido» su id.
    await openSupplies(account, home, catalog, supplies);
    expect(await supplies.list.names()).toContain('Cardamomo E2E');
  });
});
