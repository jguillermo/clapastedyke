import { test, expect } from '../../fixtures/app-fixture';
import { E2E_ACCOUNT } from '../../support/google-double';
import { backToAccount, openSupplies } from '../../support/navigation';
import { RECIPES } from '../../support/seed';

/**
 * **Dos pestañas del mismo navegador.** No es lo mismo que dos aparatos (eso es
 * `two-devices.spec.ts`): aquí la base de datos, la cookie y el `sid` son **los mismos**, y lo único
 * que no se comparte es la memoria.
 *
 * Esa asimetría es todo el tema del fichero. La sesión de la app vive en memoria (`InMemorySession`)
 * y el contexto `auth` **no tiene ningún canal entre pestañas** —no hay `BroadcastChannel` ahí; el
 * que existe es de `external-sync`, y solo sirve para avisar de que hay que releer—. Así que:
 *
 * - lo que está **debajo** (catálogo, cola, pista de sesión, `sid`) se comparte al instante;
 * - lo que está **en memoria** (quién eres, tu token) no se comparte nunca.
 *
 * ## Qué se demuestra
 *
 * 1. **Abrir otra pestaña no abre otra sesión.** Reanuda sola contra el backend, con la misma sesión
 *    del servicio, sin ventana y sin que el usuario toque nada. Si abriera una sesión por pestaña,
 *    alguien con cinco pestañas dejaría cinco `sessions/{sid}` en Firestore por cada arranque.
 * 2. **La reanudación es por pestaña.** El intento único de `ResumeSession` es un campo de instancia,
 *    y cada pestaña tiene el suyo: dos pestañas son dos peticiones. Es esperado y benigno, pero
 *    conviene que esté escrito, porque parece un fallo cuando se ve en el registro.
 * 3. **Lo que una pestaña guarda, la otra lo ve.** Misma IndexedDB.
 * 4. **Cerrar sesión en una deja huérfana a la otra.** Es la arista de verdad, y está aquí para que
 *    deje de ser una sorpresa: durante un rato la segunda pestaña sigue diciendo «Conectada» y
 *    conservando un token válido de una sesión que en el servidor ya no existe. Este recorrido fija
 *    ese comportamiento **y su límite** — recargar la pone de acuerdo con la realidad.
 *
 * El punto 4 no es una aprobación: es la descripción de lo que hoy hace la app. Si algún día se
 * añade un canal entre pestañas para `auth`, este test es el que hay que cambiar, y el cambio se
 * leerá como lo que es.
 */

test.describe('Cuenta · dos pestañas del mismo navegador', () => {
  test('conectar en la primera → la segunda reanuda sola con la misma sesión → la segunda crea un insumo y la primera lo ve → cerrar sesión en la primera → la segunda queda huérfana hasta que se recarga', async ({
    google,
    account,
    home,
    catalog,
    supplies,
    secondTab,
  }) => {
    await account.goto();
    await account.connectAndWait();

    expect(google.tokenRequestCount, 'conectar no reanuda nada: no había sesión previa').toBe(0);
    expect(google.openSessionCount, 'conectar abre una sesión').toBe(1);

    // ── Caso 1 · la segunda pestaña se encuentra dentro sin que nadie haga nada ──────────────────
    await secondTab.account.goto();

    await expect(secondTab.account.connectedAs(E2E_ACCOUNT.name)).toBeVisible();
    await expect(secondTab.account.accountSummary).toContainText('Conectada');
    // Nadie pulsó «Conectar»: la sesión volvió por el backend, con la pista y el `sid` que había en
    // la base compartida.
    expect(google.tokenRequestCount, 'la segunda pestaña reanuda con su propia petición').toBe(1);
    expect(
      google.openSessionCount,
      'abrir una pestaña NO abre otra sesión: el navegador tiene una sola',
    ).toBe(1);
    expect(google.sheets, 'y sigue siendo la misma hoja').toHaveLength(1);

    // ── Caso 2 · lo que guarda una pestaña lo ve la otra: la base es la misma ────────────────────
    await openSupplies(secondTab);
    await secondTab.supplies.list.addSupply('Manteca de pestaña E2E', '500', '9.90');
    await secondTab.supplies.list.waitAdded();

    await openSupplies({ account, home, catalog, supplies });
    await expect
      .poll(() => supplies.list.names(), { timeout: 20_000 })
      .toContain('Manteca de pestaña E2E');

    // ── Caso 3 · cerrar sesión en la primera: la segunda se queda huérfana ───────────────────────
    // Las dos vuelven a `/cuenta` andando, que es donde se ve la sesión. La segunda **sin recargar**:
    // es la que tiene que quedarse con su sesión en memoria intacta.
    await backToAccount(secondTab);
    await backToAccount({ account, home, catalog, supplies });

    await account.disconnectAndWait();
    expect(google.openSessionCount, 'cerrar sesión cierra la sesión del navegador').toBe(0);

    // La arista: la segunda pestaña no se ha enterado. Su sesión vive en su memoria y nadie se la
    // ha tocado, así que sigue enseñando la cuenta y su token sigue siendo válido una hora más —
    // aunque en el servicio ya no haya ninguna sesión detrás.
    await expect(secondTab.account.accountSummary).toContainText('Conectada');
    await expect(secondTab.account.connect).toHaveCount(0);

    // ── Estado terminal · recargar la pone de acuerdo con la realidad ────────────────────────────
    // El desajuste dura lo que dure esa pestaña sin recargar. Al recargar no hay pista que reanudar
    // —el cierre de sesión vació la base— y la app arranca como un navegador recién estrenado: sin
    // cuenta y con el recetario de ejemplo otra vez sembrado.
    await secondTab.account.reload();

    await expect(secondTab.account.accountSummary).toContainText('Sin conectar');
    await expect(secondTab.account.connect).toBeEnabled();

    await secondTab.account.backToKitchen.click();
    await expect(secondTab.home.dock).toBeVisible();
    await secondTab.home.station('Libro de recetas').click();
    await secondTab.catalog.waitReady();

    const [queque] = RECIPES.Queques;
    await expect(secondTab.catalog.recipe('Queques', queque).first()).toBeVisible();
  });
});
