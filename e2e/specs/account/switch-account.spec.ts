import { test, expect } from '../../fixtures/app-fixture';
import { E2E_ACCOUNT, E2E_ACCOUNT_2 } from '../../support/google-double';
import { backToAccount, openSupplies } from '../../support/navigation';
import { SUPPLY_COUNT } from '../../support/seed';

/**
 * **Dos personas, el mismo navegador.** Lo que hay que demostrar es que la segunda no hereda nada de
 * la primera: ni en su hoja, ni en la pantalla, ni en la cola de sincronización.
 *
 * ## Por qué es el recorrido con más que perder
 *
 * Es el único sitio donde se cruzan tres cosas que por separado ya funcionan:
 *
 * 1. **El aparato se vacía al cerrar sesión** (`SignOut` → `LocalData.wipe()`), y vuelve a sembrarse
 *    el recetario de ejemplo.
 * 2. **`AuthChangedSubscriber` tira la cola de la cuenta anterior** al entrar una nueva, y empuja el
 *    recetario completo.
 * 3. **Cada Drive es suyo.** `drive.file` solo alcanza los ficheros que la app creó **para esa
 *    persona**: la hoja de la primera no existe para la segunda, ni siquiera para buscarla.
 *
 * Si cualquiera de las tres fallara, el fallo sería el peor posible y además silencioso: las recetas
 * de una persona apareciendo en la hoja de Drive de otra. Nadie recibe un aviso de eso.
 *
 * ## Lo que el doble tuvo que aprender para esto
 *
 * El token de acceso ahora **lleva dentro de quién es** (`accessTokenFor`), y cada hoja del doble
 * tiene dueño. Antes todas las hojas vivían en la misma lista: la segunda cuenta habría encontrado la
 * hoja de la primera al buscarla por nombre y la habría adoptado — y el test habría dado por buena
 * exactamente la fuga que viene a impedir.
 */
test.describe('Cuenta · cambiar de cuenta en el mismo navegador', () => {
  test('la primera cuenta sube un insumo suyo → cerrar sesión → entra la segunda → estrena su propia hoja con el catálogo de fábrica, sin nada de la primera → y la hoja de la primera sigue intacta', async ({
    google,
    account,
    home,
    catalog,
    supplies,
  }) => {
    const surface = { account, home, catalog, supplies };

    // ── La primera cuenta deja algo suyo, aquí y en su hoja ──────────────────────────────────────
    await account.goto();
    await account.connectAndWait();
    await expect(account.connectedAs(E2E_ACCOUNT.name)).toBeVisible();

    await openSupplies(surface);
    await supplies.list.addSupply('Manteca de la primera E2E', '500', '12.50');
    await supplies.list.waitAdded();
    await backToAccount(surface);

    await account.syncAll.click();
    await expect(account.statusLabel).toHaveText('Al día');

    // Se espera a la HOJA y no al rótulo: «Al día» describe el ciclo que acabó, y la escritura de la
    // fila ocurre dentro de él. Comprobarla a pelo justo después es una carrera que se pierde.
    const primera = google.sheetOf(E2E_ACCOUNT);
    await expect
      .poll(() => primera.tab('ingredients').dataRowCount, { timeout: 20_000 })
      .toBe(SUPPLY_COUNT + 1);
    expect(
      primera.tab('ingredients').rowOfField('name', 'Manteca de la primera E2E'),
      'lo que creó la primera tiene que estar en SU hoja',
    ).toBeGreaterThan(1);

    // ── Se va, y el aparato vuelve a ser de nadie ────────────────────────────────────────────────
    await account.disconnectAndWait();
    expect(google.openSessionCount, 'no queda ninguna sesión abierta').toBe(0);

    // ── Entra la segunda: otra persona, otro Drive ───────────────────────────────────────────────
    google.signInAs(E2E_ACCOUNT_2);
    await account.connectAndWait();

    await expect(account.connectedAs(E2E_ACCOUNT_2.name)).toBeVisible();
    await expect(account.connectedAs(E2E_ACCOUNT.name)).toHaveCount(0);

    // Su hoja es OTRA. No es que no la haya adoptado: es que la de la primera no existe para ella.
    const segunda = google.sheetOf(E2E_ACCOUNT_2);
    expect(segunda.id, 'cada cuenta estrena la suya').not.toBe(primera.id);
    expect(google.sheets, 'dos cuentas, dos hojas').toHaveLength(2);
    await expect(account.sheetLink).toHaveAttribute('href', segunda.url);

    // ── Lo que de verdad se está probando: no hereda nada ────────────────────────────────────────
    const suyos = segunda.tab('ingredients');
    expect(
      suyos.rowOfField('name', 'Manteca de la primera E2E'),
      'el insumo de la primera NO puede aparecer en la hoja de la segunda',
    ).toBe(-1);
    // Solo el catálogo de fábrica, que es lo que el aparato resembró al vaciarse. Ni una fila más:
    // si la cola de la cuenta anterior hubiera sobrevivido, subiría aquí.
    expect(suyos.dataRowCount, 'solo el recetario de ejemplo').toBe(SUPPLY_COUNT);

    // Y en la pantalla tampoco: la lista es la de fábrica otra vez.
    await openSupplies(surface);
    const enPantalla = (await supplies.list.names()).filter((name) => name.length > 0);
    expect(enPantalla).not.toContain('Manteca de la primera E2E');
    expect(enPantalla).toHaveLength(SUPPLY_COUNT);

    // ── Estado terminal · la hoja de la primera sigue donde estaba, y como estaba ────────────────
    // Cambiar de cuenta en un aparato no toca el Drive de quien se fue: sus datos siguen en su hoja
    // y vuelven enteros el día que reconecte.
    expect(primera.tab('ingredients').dataRowCount).toBe(SUPPLY_COUNT + 1);
    expect(
      primera.tab('ingredients').rowOfField('name', 'Manteca de la primera E2E'),
    ).toBeGreaterThan(1);
    expect(primera.trashed, 'ni se borra ni se manda a la papelera').toBe(false);
  });
});
