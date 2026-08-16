import { test, expect } from '../../fixtures/app-fixture';
import { RECIPES, SUPPLY_COUNT } from '../../support/seed';

/**
 * Las barreras: cuándo la sincronización **se niega a seguir**.
 *
 * «La hoja es la fuente de la verdad» tiene un filo peligroso: la regla «estaba en la base y ya no está
 * en la hoja ⇒ borrado» convierte un clic derecho → «Eliminar hoja» en un borrado masivo replicado a
 * todos los dispositivos. Por eso hay tres barreras, y son lo primero que no se puede entregar sin.
 *
 * Este journey las dispara una a una y comprueba las dos mitades de cada una:
 *
 * 1. Que el ciclo **avisa** y no toca nada (el catálogo local sigue completo).
 * 2. Que **arreglar la hoja** devuelve la convergencia — una barrera no es un callejón sin salida.
 *
 * Ninguno de los tres casos persiste nada, así que el orden entre ellos es libre; el journey acaba con
 * la hoja arreglada y al día, que es el estado terminal.
 */
test.describe('Cuenta · barreras de la sincronización', () => {
  test('borrado masivo a mano → se niega y no borra nada → hoja arreglada, converge → pestaña eliminada → se niega → devuelta, converge → cabecera renombrada → se niega y NO la repara sola → arreglada, converge', async ({
    google,
    connectAccount,
    account,
    home,
    catalog,
  }) => {
    await connectAccount();
    const sheet = google.sheet;
    const insumos = sheet.tab('ingredients');
    const intact = insumos.snapshot();

    // ── Caso 1 · alguien borra ocho filas de Insumos ─────────────────────────────────────────────
    // Ocho de veintidós pasa del 30 % sin llegar a las veinte del tope absoluto: es el porcentaje el
    // que muerde, que es el caso realista (un rango seleccionado por error).
    for (let deleted = 0; deleted < 8; deleted += 1) {
      insumos.deleteRow(2);
    }
    expect(insumos.dataRowCount).toBe(SUPPLY_COUNT - 8);

    await account.syncAll.click();
    await expect(
      account.problems.filter({ hasText: 'se borrarían 8 filas' }).first(),
    ).toBeVisible();
    await expect(account.statusLabel).toHaveText('Error');

    // La otra mitad de la barrera: aquí no se ha borrado nada.
    await account.backToKitchen.click();
    await expect(home.dock).toBeVisible();
    await home.station('Libro de recetas').click();
    await catalog.waitReady();
    expect(await catalog.recipeNamesIn('Queques')).toEqual([...RECIPES.Queques]);
    await catalog.back.click();
    await expect(home.dock).toBeVisible();
    await home.accountLink.click();
    await expect(account.root).toBeVisible();

    // Arreglada la hoja, el ciclo vuelve a funcionar sin que nadie tenga que reinstalar nada.
    insumos.restore(intact);
    await account.syncAll.click();
    await expect(account.statusLabel).toHaveText('Al día');

    // ── Caso 2 · alguien elimina la pestaña de Sabores ───────────────────────────────────────────
    const sabores = sheet.removeTab('flavors');

    await account.syncAll.click();
    await expect(
      account.problems.filter({ hasText: 'falta la pestaña «flavors»' }).first(),
    ).toBeVisible();
    await expect(account.statusLabel).toHaveText('Error');
    // Una pestaña que falta aborta el ciclo ENTERO, no solo su tabla: los insumos siguen en la hoja.
    expect(insumos.dataRowCount).toBe(SUPPLY_COUNT);

    sheet.attachTab(sabores);
    await account.syncAll.click();
    await expect(account.statusLabel).toHaveText('Al día');

    // ── Caso 3 · alguien renombra la cabecera de una columna ─────────────────────────────────────
    /*
     * La cabecera es **fija**: seis columnas, siempre las mismas. Así que comprobarla es comparar, y
     * una pestaña cuya cabecera no es la nuestra no se toca — sus filas no se pueden interpretar, y
     * escribir sobre ellas sería destruir lo que haya puesto quien la tenga así.
     *
     * Sustituye a la barrera anterior, que miraba columna a columna si el shadow recordaba alguna que
     * ya no estuviera: más simple, y no depende de lo que se recuerde.
     */
    insumos.setHeader('datos', 'contenido');

    await account.syncAll.click();
    const misplaced = account.problems.filter({
      hasText: 'no es la que escribe la sincronización',
    });
    await expect(misplaced.first()).toBeVisible();
    await expect(account.statusLabel).toHaveText('Error');
    expect(insumos.dataRowCount).toBe(SUPPLY_COUNT);

    // La cabecera **se queda como la dejó el usuario**: la barrera se niega a seguir, no repara. Si la
    // reparase sola, el ciclo siguiente encontraría todo en orden y nadie se enteraría de que alguien
    // estuvo a punto de perder una columna entera.
    expect(insumos.headers).toContain('contenido');

    // Y como no se arregla solo, el ciclo se sigue negando hasta que alguien lo arregla de verdad.
    insumos.setHeader('contenido', 'datos');
    await account.syncAll.click();
    await expect(account.statusLabel).toHaveText('Al día');
    expect(insumos.dataRowCount).toBe(SUPPLY_COUNT);
  });
});
