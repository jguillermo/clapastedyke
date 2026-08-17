import { test, expect } from '../../fixtures/app-fixture';
import { RECIPES, SUPPLIES, SUPPLY_COUNT } from '../../support/seed';

/**
 * `features/account` (`/cuenta`) · **cerrar sesión deja el aparato vacío**.
 *
 * Cerrar sesión aquí no es «salir»: borra TODO lo que este navegador guarda —recetas, insumos, cola
 * de sincronización, enlace con la hoja, pista de sesión y cola de eventos— y rearranca la app, que
 * vuelve a sembrar el recetario de ejemplo. Es la operación más destructiva de la aplicación, así
 * que es la que más necesita un E2E: nada de esto se puede ver desde un unitario, porque lo que hay
 * que comprobar es qué queda en el navegador **después de un arranque en frío**.
 *
 * Lo que demuestra este fichero, por orden:
 *
 * 1. **Se avisa antes, y el aviso cuenta lo que de verdad se pierde**: los cambios que quedaron sin
 *    subir. Preguntar sin decir eso sería preguntar por preguntar.
 * 2. **Cancelar no toca nada**: ni la sesión, ni la cola, ni los datos.
 * 3. **Confirmar borra de verdad**: lo que el usuario había hecho en este aparato desaparece, y el
 *    recetario de ejemplo vuelve a estar ahí — o sea, se borró **y** se volvió a sembrar.
 * 4. **No queda con qué volver a entrar solo**: tras el rearranque no se le pide ni un token al
 *    backend, porque no queda pista ninguna. Hay que autorizar otra vez, a mano.
 * 5. **La hoja del usuario no se toca**: al reconectar, todo lo que estaba sincronizado baja de
 *    vuelta. Es la otra mitad de la promesa — sin ella, «borra todo» daría miedo con razón.
 *
 * El punto 5 es además la única forma de comprobar el orden interno del cierre. Si se borrara la
 * base **antes** de perder la conexión, un ciclo de sincronización podría leer una base vacía y
 * escribir esa matanza en la hoja: al reconectar no volvería nada y este journey terminaría con un
 * recetario en blanco.
 */
const RENOMBRADA = 'Keke de Limón renombrado E2E';
const INSUMO_PENDIENTE = 'Tocino E2E';

test.describe('Cuenta · cerrar sesión', () => {
  test('cambio subido + cambio pendiente → Cerrar sesión avisa de lo que se perderá → Cancelar deja todo igual → sincronizar → confirmar borra el aparato y lo siembra de nuevo → recargar no resucita la sesión → reconectar recupera lo que estaba en la hoja', async ({
    google,
    connectAccount,
    account,
    home,
    catalog,
    form,
    supplies,
  }) => {
    await connectAccount();

    // ── Preparación · un cambio que SÍ llega a la hoja ───────────────────────────────────────────
    // Renombrar una receta sembrada sirve para las dos mitades del journey: después de cerrar sesión
    // tiene que haber vuelto su nombre de fábrica (se borró y se sembró), y después de reconectar
    // tiene que volver el nombre nuevo (la hoja lo conservaba).
    await account.backToKitchen.click();
    await expect(home.dock).toBeVisible();
    await home.station('Libro de recetas').click();
    await catalog.waitReady();

    await catalog.recipe('Queques', 'Keke de Limón').click();
    await form.waitReady();
    await form.name.fill(RENOMBRADA);
    await form.save.click();
    await form.waitClosed();
    expect(await catalog.recipeNamesIn('Queques')).toContain(RENOMBRADA);

    // Se espera a que esté EN LA HOJA: lo que se prueba al final es que la hoja lo conservaba, así
    // que el journey no puede seguir mientras el cambio siga siendo solo local.
    const recetas = google.sheet.tab('recipes');
    await expect
      .poll(() => recetas.rowOfField('name', RENOMBRADA), { timeout: 30_000 })
      .toBeGreaterThan(1);

    // ── Preparación · y un cambio que NO llega: la red se queda retenida ─────────────────────────
    // Se retiene en vez de fallar: un fallo de recurso dejaría un error en la consola y la suite cae
    // ante cualquiera (fixture `consoleErrors`). Retener consigue lo mismo — el ciclo no termina.
    google.hold();

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    await supplies.list.addSupply(INSUMO_PENDIENTE, '250', '11.90');
    await supplies.close.click();
    await supplies.waitClosed();

    await account.goto();
    await expect(account.pending).toHaveText('1');

    // ── Caso 1 · el aviso dice exactamente lo que se pierde ──────────────────────────────────────
    await account.disconnect.click();
    await expect(account.signOutWarning).toBeVisible();
    // La cuenta, con su concordancia: «1 cambio», no «1 cambios». La redacta el caso de uso.
    await expect(account.signOutWarning).toContainText('1 cambio sin sincronizar');
    // Y se dice lo otro, que es lo que hace la operación asumible: la copia de Drive sigue ahí.
    await expect(account.signOutWarning).toContainText('Tu hoja en Drive no se toca');

    // ── Caso 2 · cancelar no toca nada ───────────────────────────────────────────────────────────
    await account.cancelDisconnect.click();
    await expect(account.signOutWarning).toHaveCount(0);
    await expect(account.accountSummary).toContainText('Conectada');
    await expect(account.pending).toHaveText('1');
    await expect(account.disconnect).toBeVisible();

    // ── Caso 3 · vuelve la red, sube lo pendiente y ya no hay nada que perder ────────────────────
    google.resume();
    await expect(account.pending).toHaveText('0', { timeout: 30_000 });
    await expect(account.statusLabel).toHaveText('Al día', { timeout: 30_000 });
    const insumos = google.sheet.tab('ingredients');
    await expect
      .poll(() => insumos.rowOfField('name', INSUMO_PENDIENTE), { timeout: 30_000 })
      .toBeGreaterThan(1);
    const hoja = google.sheet;

    // ── Caso 4 · cerrar sesión de verdad: se pregunta, se confirma y la app rearranca ────────────
    const tokensAntes = google.tokenRequestCount;

    await account.disconnectAndWait();

    await expect(account.accountSummary).toContainText('Sin conectar');
    await expect(account.sheetLink).toHaveCount(0);
    await expect(account.pending).toHaveText('0');
    await expect(account.lastSynced).toHaveText('—');
    // No queda con qué volver a entrar solo: sin pista, la reanudación ni pregunta. Es lo que
    // demuestra que la sesión, la cookie y todo su rastro se fueron de verdad.
    expect(google.tokenRequestCount, 'sin pista de sesión no se le pide token a nadie').toBe(
      tokensAntes,
    );

    // ── Caso 5 · el aparato quedó vacío Y sembrado otra vez ──────────────────────────────────────
    await account.backToKitchen.click();
    await expect(home.dock).toBeVisible();
    await home.station('Libro de recetas').click();
    await catalog.waitReady();

    const enQueques = await catalog.recipeNamesIn('Queques');
    // Lo del usuario se fue…
    expect(enQueques).not.toContain(RENOMBRADA);
    // …y lo de fábrica volvió: solo puede estar si la siembra se aplicó otra vez, porque su marcador
    // se borró con todo lo demás.
    expect(enQueques).toContain('Keke de Limón');
    expect(enQueques).toHaveLength(RECIPES.Queques.length);

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const insumosLocales = await supplies.list.names();
    expect(insumosLocales).not.toContain(INSUMO_PENDIENTE);
    expect(insumosLocales).toContain(SUPPLIES.harina.name);
    await supplies.close.click();
    await supplies.waitClosed();

    // ── Caso 6 · reconectar recupera lo que estaba en la hoja ────────────────────────────────────
    // Estado terminal del journey, y la prueba de que el borrado nunca llegó a viajar: si el cierre
    // hubiera sincronizado la base vacía, aquí no bajaría nada.
    await account.goto();
    await account.connectAndWait();

    expect(google.sheets, 'reconectar adopta la hoja de siempre, no crea otra').toHaveLength(1);
    expect(google.sheet.id).toBe(hoja.id);
    await expect(account.statusLabel).toHaveText('Al día', { timeout: 30_000 });

    await account.backToKitchen.click();
    await expect(home.dock).toBeVisible();
    await home.station('Libro de recetas').click();
    await catalog.waitReady();

    const recuperadas = await catalog.recipeNamesIn('Queques');
    expect(recuperadas).toContain(RENOMBRADA);
    expect(recuperadas).not.toContain('Keke de Limón');
    expect(recuperadas).toHaveLength(RECIPES.Queques.length);

    await catalog.suppliesButton.click();
    await supplies.waitReady();
    const recuperados = await supplies.list.names();
    expect(recuperados).toContain(INSUMO_PENDIENTE);
    // Ni uno de más: los ids del seed son fijos, así que lo que baja se empareja con lo sembrado.
    expect(google.sheet.tab('ingredients').dataRowCount).toBe(SUPPLY_COUNT + 1);
  });
});
