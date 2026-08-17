import { test, expect } from '../../fixtures/app-fixture';
import { clearLocalDatabases } from '../../support/clear-local-databases';
import { E2E_ACCOUNT } from '../../support/google-double';
import {
  CATEGORIES,
  FLAVORS,
  MOLDS,
  PORTIONS,
  RECIPES,
  SUPPLIES,
  SUPPLY_COUNT,
} from '../../support/seed';

/**
 * `features/account` (`/cuenta`): conectar la cuenta de Google y sincronizar con la hoja.
 *
 * Cubre el camino entero de la integración, que es el único de la app que habla con un servidor: desde
 * «sin conectar» hasta el recetario escrito en una hoja de verdad, con el doble de Google respondiendo
 * (ver `support/google-double.ts`).
 *
 * Lo que este fichero demuestra y ningún unitario puede:
 *
 * 1. **La hoja acaba con el catálogo completo**, con sus cabeceras, sus columnas de servicio y su
 *    versión de esquema — no «se llamó al gateway», sino qué quedó escrito.
 * 2. **El ciclo es idempotente.** Repetirlo no duplica ni una fila. Es la propiedad de la que depende
 *    todo el diseño (se reescribe la pestaña entera en cada ciclo) y solo se ve con una hoja detrás.
 * 3. **La ida y vuelta por la hoja no cambia ningún dato.** «Comprobar la hoja» dice «todo está al día»
 *    *después* de que cada valor haya pasado por una celda y haya vuelto — incluida la conversión que
 *    hace Sheets de `'4.5'` a `4.5`. Si la canonización no fuera determinista en ese viaje, aquí
 *    saldrían veintidós diferencias.
 * 4. **Recargar la página no echa a nadie, y cerrar sesión no se deshace al recargar.** La credencial
 *    vive solo en memoria, así que una recarga siempre la pierde: lo que se prueba es que se
 *    recupera **sin pedirle nada al usuario**. Es el fallo que llegó a producción justo por no estar
 *    aquí.
 * 5. **Una hoja en la papelera no deja al usuario sin sincronizar**: se crea otra y se vuelve a llenar.
 */
const RECIPE_COUNT = Object.values(RECIPES).flat().length;

test.describe('Cuenta · conexión y sincronización', () => {
  test('sin conectar → conectar crea la hoja y sube el recetario → comprobar dice que está al día → sincronizar otra vez no duplica nada → recargar sigue conectada → cerrar sesión → recargar sigue desconectada → hoja en la papelera → se crea otra con todo', async ({
    google,
    account,
    syncBadge,
    page,
  }) => {
    await account.goto();

    // ── Caso 1 · sin cuenta no se puede hacer nada, y no se avisa de nada ────────────────────────
    await expect(account.accountSummary).toContainText('Sin conectar');
    await expect(account.connect).toBeEnabled();
    await expect(account.check).toBeDisabled();
    await expect(account.syncAll).toBeDisabled();
    await expect(account.pending).toHaveText('0');
    await expect(account.lastSynced).toHaveText('—');
    // Quien no ha conectado cuenta no tiene copia remota de la que avisar: el aviso no existe.
    await syncBadge.waitInvisible(5_000);

    // ── Caso 2 · conectar lo hace todo: cuatro pasos, y la hoja queda escrita ────────────────────
    await account.connectAndWait();

    await expect(account.steps.filter({ hasText: 'Hecho' })).toHaveCount(4);
    await expect(account.accountSummary).toContainText('Conectada');
    await expect(account.connectedAs(E2E_ACCOUNT.name)).toBeVisible();
    await expect(account.statusLabel).toHaveText('Al día');
    await expect(account.sheetLink).toHaveAttribute('href', google.sheet.url);

    const sheet = google.sheet;
    expect(sheet.title).toBe('Clapastedyke — Recetario');
    // Una pestaña por tabla replicada, con el nombre de la tabla. La de servicio se crea con la hoja,
    // así que va primera; las demás las crea la primera escritura, en el orden en que se sincronizan.
    expect(sheet.titles).toEqual([
      '_meta',
      'ingredients',
      'recipes',
      'recipe_categories',
      'flavors',
      'conversion_options',
    ]);

    // Seis columnas fijas: la identidad, el registro entero en JSON, y las de servicio.
    const insumos = sheet.tab('ingredients');
    expect(insumos.headers).toEqual(['id', 'datos', 'version', 'origen', 'huella', 'borrado']);

    // El catálogo entero, tabla por tabla: nada se queda por el camino.
    expect(insumos.dataRowCount).toBe(SUPPLY_COUNT);
    expect(sheet.tab('recipes').dataRowCount).toBe(RECIPE_COUNT);
    expect(sheet.tab('recipe_categories').dataRowCount).toBe(CATEGORIES.length);
    expect(sheet.tab('flavors').dataRowCount).toBe(FLAVORS.length);
    expect(sheet.tab('conversion_options').dataRowCount).toBe(PORTIONS.length + MOLDS.length);

    /*
     * Una fila concreta, con el registro entero en su celda y **con sus tipos**: el precio es un
     * número porque el JSON dice que lo es. Con una columna por campo volvía como texto, el
     * repositorio lo descartaba como documento sin precio y el insumo desaparecía del catálogo.
     *
     * Y con su huella escrita: sin ella, el ciclo siguiente la tomaría por editada a mano.
     */
    const harina = insumos.rowOf('id', SUPPLIES.harina.id);
    expect(harina).toBeGreaterThan(1);
    const registro = insumos.record(harina);
    expect(registro['name']).toBe(SUPPLIES.harina.name);
    expect(registro['purchasePrice']).toMatchObject({ amount: Number(SUPPLIES.harina.price) });
    // La fecha de guardado no viaja: su información va en la columna `version`.
    expect(registro).not.toHaveProperty('updatedAt');
    expect(String(insumos.cell(harina, 'huella'))).not.toBe('');
    expect(String(insumos.cell(harina, 'version'))).not.toBe('');
    expect(insumos.cell(harina, 'borrado')).toBe('');

    // Las líneas de una receta viajan **dentro de su receta**: ya no hay una pestaña hija sin
    // identidad propia, ni una columna por campo.
    const receta = sheet.tab('recipes').record(2);
    expect(Array.isArray(receta['lines'])).toBe(true);
    expect(sheet.find('RecetaInsumos')).toBeUndefined();

    // La versión del esquema queda apuntada en la pestaña de servicio. Hoy nadie la lee: está ahí para
    // el día que haya una migración, que necesitará saber con qué forma se escribió lo que encuentre.
    const meta = sheet.tab('_meta');
    // Texto, y no número: la pestaña de servicio no son datos del usuario, es una nota para quien mire
    // la hoja. Lo que sí viaja con su tipo son las celdas de las tablas (ver el precio de arriba).
    expect(meta.cell(meta.rowOf('Clave', 'schemaVersion'), 'Valor')).toBe('5');

    // ── Caso 3 · un ciclo más para asentar, y la comprobación no encuentra nada que mover ────────
    await account.syncAll.click();
    await expect(account.statusLabel).toHaveText('Al día');

    await account.check.click();
    // Esta frase es la que valida el viaje de ida y vuelta de CADA valor por una celda. Si un solo
    // campo volviera distinto de como se escribió, aquí habría diferencias en vez de silencio.
    await expect(account.checkSummary).toContainText('todo está al día');

    // ── Caso 4 · idempotencia: reescribir la hoja entera no duplica ni una fila ──────────────────
    const rowCounts = (): Record<string, number> =>
      Object.fromEntries(sheet.titles.map((title) => [title, sheet.tab(title).dataRowCount]));

    const before = rowCounts();
    await account.syncAll.click();
    await expect(account.statusLabel).toHaveText('Al día');
    expect(rowCounts()).toEqual(before);
    await expect(account.pending).toHaveText('0');
    await syncBadge.waitInvisible(5_000);

    /*
     * ── Caso 5 · RECARGAR NO ECHA A NADIE ────────────────────────────────────────────────────────
     *
     * El caso que este fichero no cubría, y por eso el fallo llegó a producción. La credencial vive
     * solo en memoria, así que una recarga siempre la pierde: lo que tiene que funcionar es
     * **recuperarla sin molestar al usuario**, y eso es lo único que se comprueba aquí.
     *
     * Con el flujo anterior era imposible: reanudar abría una ventana emergente de Google, y como la
     * reanudación corre en el arranque de la página —sin ningún clic detrás— el navegador la
     * bloqueaba. El doble de entonces concedía el token siempre y sin ventana, así que el test pasaba
     * en verde mientras cada F5 desconectaba de verdad.
     *
     * Se pulsa cero veces. Si hiciera falta un clic, este bloque falla.
     */
    await page.reload();
    await expect(account.root).toBeVisible();

    await expect(account.accountSummary).toContainText('Conectada');
    await expect(account.connectedAs(E2E_ACCOUNT.name)).toBeVisible();
    // La hoja es la misma: se recuperó la MISMA cuenta, no una sesión cualquiera.
    await expect(account.sheetLink).toHaveAttribute('href', sheet.url);
    // Y la sincronización vuelve sola, que es para lo que sirve tener sesión.
    await expect(account.statusLabel).toHaveText('Al día', { timeout: 30_000 });
    expect(rowCounts()).toEqual(before);

    // ── Caso 6 · cerrar sesión olvida la hoja de esta cuenta, y el aviso sigue sin existir ───────
    await account.disconnect.click();
    await expect(account.accountSummary).toContainText('Sin conectar');
    await expect(account.connect).toBeEnabled();
    await expect(account.sheetLink).toHaveCount(0);
    await syncBadge.waitInvisible(5_000);

    // ── Caso 7 · y cerrar sesión TAMBIÉN sobrevive a la recarga ──────────────────────────────────
    // El reverso del caso 5: si reanudar volviera a conectar a quien acaba de salir, sería peor que
    // el fallo original. Recargar no puede resucitar una sesión cerrada.
    await page.reload();
    await expect(account.root).toBeVisible();
    await expect(account.accountSummary).toContainText('Sin conectar');
    await expect(account.connect).toBeEnabled();

    // ── Caso 8 · la hoja acaba en la papelera: se crea otra y se vuelve a llenar ─────────────────
    // Va al final porque deja dos hojas en el Drive: es el estado menos predecible del journey.
    google.trash();
    await account.connectAndWait();

    expect(google.sheets).toHaveLength(2);
    const fresh = google.sheet;
    expect(fresh.id).not.toBe(sheet.id);
    expect(fresh.tab('ingredients').dataRowCount).toBe(SUPPLY_COUNT);
    await expect(account.sheetLink).toHaveAttribute('href', fresh.url);
    await expect(account.statusLabel).toHaveText('Al día');
  });

  test('la misma cuenta desde un dispositivo nuevo adopta la hoja que ya existe: nunca se duplica', async ({
    google,
    account,
    page,
  }) => {
    /*
     * Journey aparte porque su punto de partida es otro: un navegador **sin nada guardado**.
     *
     * Es el caso que rompía antes. Qué hoja tiene cada cuenta se recuerda en IndexedDB, que es por
     * navegador, mientras que la hoja es por cuenta: un móvil nuevo llegaba sin saber nada y creaba otra
     * «Clapastedyke — Recetario» en el mismo Drive. Una hoja por aparato, y los dispositivos
     * sincronizando cada uno contra la suya sin verse nunca.
     */
    await account.goto();
    await account.connectAndWait();

    const first = google.sheet.id;
    expect(google.sheets).toHaveLength(1);

    // Un dispositivo nuevo es exactamente esto: sin la hoja recordada y sin la pista de sesión.
    await clearLocalDatabases(page);
    await account.goto();
    await account.connectAndWait();

    // Ni una hoja más en el Drive, y la que se usa es la misma.
    expect(google.sheets).toHaveLength(1);
    expect(google.sheet.id).toBe(first);
    await expect(account.sheetLink).toHaveAttribute('href', google.sheet.url);

    // Y adoptarla no duplicó su contenido: los ids del seed son fijos, así que las filas se emparejan
    // con las que ya estaban en vez de añadirse otra vez.
    expect(google.sheet.tab('ingredients').dataRowCount).toBe(SUPPLY_COUNT);
    await expect(account.statusLabel).toHaveText('Al día');
  });
});
