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
 * 4. **Una hoja en la papelera no deja al usuario sin sincronizar**: se crea otra y se vuelve a llenar.
 */
const RECIPE_COUNT = Object.values(RECIPES).flat().length;

test.describe('Cuenta · conexión y sincronización', () => {
  test('sin conectar → conectar crea la hoja y sube el recetario → comprobar dice que está al día → sincronizar otra vez no duplica nada → cerrar sesión → hoja en la papelera → se crea otra con todo', async ({
    google,
    account,
    syncBadge,
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

    // Las columnas de servicio van al final, y son las que hacen posible la fusión.
    const insumos = sheet.tab('ingredients');
    expect(insumos.headers.slice(-4)).toEqual(['version', 'origen', 'huella', 'borrado']);

    // El catálogo entero, tabla por tabla: nada se queda por el camino.
    expect(insumos.dataRowCount).toBe(SUPPLY_COUNT);
    expect(sheet.tab('recipes').dataRowCount).toBe(RECIPE_COUNT);
    expect(sheet.tab('recipe_categories').dataRowCount).toBe(CATEGORIES.length);
    expect(sheet.tab('flavors').dataRowCount).toBe(FLAVORS.length);
    expect(sheet.tab('conversion_options').dataRowCount).toBe(PORTIONS.length + MOLDS.length);

    // Una fila concreta, con su precio anidado desplegado en columnas con ruta y su huella escrita:
    // sin huella, el ciclo siguiente la tomaría por editada a mano.
    const harina = insumos.rowOf('id', SUPPLIES.harina.id);
    expect(harina).toBeGreaterThan(1);
    expect(insumos.cell(harina, 'name')).toBe(SUPPLIES.harina.name);
    expect(insumos.cell(harina, 'purchasePrice.amount')).toBe(Number(SUPPLIES.harina.price));
    expect(String(insumos.cell(harina, 'huella'))).not.toBe('');
    expect(String(insumos.cell(harina, 'version'))).not.toBe('');
    expect(insumos.cell(harina, 'borrado')).toBe('');

    // Las líneas de una receta viajan **dentro de su receta**, en una celda marcada como lista: ya no
    // hay una pestaña hija sin identidad propia.
    const recetas = sheet.tab('recipes');
    expect(recetas.headers).toContain('lines[]');
    expect(sheet.find('RecetaInsumos')).toBeUndefined();

    // La versión del esquema queda apuntada en la pestaña de servicio: es lo que dispara el retiro de
    // las pestañas de una hoja escrita con una versión anterior.
    const meta = sheet.tab('_meta');
    expect(meta.cell(meta.rowOf('Clave', 'schemaVersion'), 'Valor')).toBe(5);

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

    // ── Caso 5 · cerrar sesión olvida la hoja de esta cuenta, y el aviso sigue sin existir ───────
    await account.disconnect.click();
    await expect(account.accountSummary).toContainText('Sin conectar');
    await expect(account.connect).toBeEnabled();
    await expect(account.sheetLink).toHaveCount(0);
    await syncBadge.waitInvisible(5_000);

    // ── Caso 6 · la hoja acaba en la papelera: se crea otra y se vuelve a llenar ─────────────────
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
