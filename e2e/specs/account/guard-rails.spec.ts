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
    const insumos = sheet.tab('Insumos');
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
      account.problems.filter({ hasText: 'Se borrarían demasiadas filas' }).first(),
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
    const sabores = sheet.removeTab('Sabores');

    await account.syncAll.click();
    await expect(
      account.problems.filter({ hasText: 'Falta la pestaña «Sabores»' }).first(),
    ).toBeVisible();
    await expect(account.statusLabel).toHaveText('Error');
    // Una pestaña que falta aborta el ciclo ENTERO, no solo su tabla: los insumos siguen en la hoja.
    expect(insumos.dataRowCount).toBe(SUPPLY_COUNT);

    sheet.attachTab(sabores);
    await account.syncAll.click();
    await expect(account.statusLabel).toHaveText('Al día');

    // ── Caso 3 · alguien renombra una cabecera ───────────────────────────────────────────────────
    // La cabecera es la prueba de que la columna N sigue siendo el campo N. Sin comprobarla, todo lo
    // que viniera detrás de una columna insertada se leería corrido —el precio en la columna de la
    // moneda— y, al quedar la fila coherente consigo misma, no se vería nunca.
    insumos.setHeader('Nombre', 'Nombre del insumo');

    await account.syncAll.click();
    const misplaced = account.problems.filter({ hasText: 'Las columnas de «Insumos»' });
    await expect(misplaced.first()).toBeVisible();
    await expect(account.statusLabel).toHaveText('Error');
    expect(insumos.dataRowCount).toBe(SUPPLY_COUNT);

    /*
     * La cabecera **se queda como la dejó el usuario**, y eso es la barrera funcionando.
     *
     * El paso que pone al día la forma de la hoja también escribe la fila de cabecera, y corre después de
     * decidir justamente por esto: si la reparara antes, una columna *insertada* quedaría tapada — este
     * ciclo abortaría, pero el siguiente vería cabeceras que cuadran sobre datos corridos un sitio y ya no
     * se quejaría nunca. La barrera duraría un ciclo y el daño sería permanente.
     */
    expect(insumos.headers).toContain('Nombre del insumo');

    // Y como no se arregla solo, el ciclo se sigue negando hasta que alguien lo arregla de verdad.
    insumos.setHeader('Nombre del insumo', 'Nombre');
    await account.syncAll.click();
    await expect(account.statusLabel).toHaveText('Al día');
    expect(insumos.dataRowCount).toBe(SUPPLY_COUNT);
  });
});
