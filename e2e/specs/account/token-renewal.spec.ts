import { test, expect } from '../../fixtures/app-fixture';
import { E2E_ACCOUNT } from '../../support/google-double';
import { RECIPES, SUPPLIES, SUPPLY_COUNT } from '../../support/seed';

/**
 * **La renovación silenciosa**: qué pasa cuando el token de acceso cumple su hora.
 *
 * Es el camino más recorrido de toda la sesión —le ocurre a cada persona cada hora que tiene la app
 * abierta— y era el único sin una sola prueba. Los demás recorridos de `specs/account/` cubren el
 * arranque (`account.spec.ts`), la falta de cobertura y el `401` al recargar (`offline-session.spec.ts`)
 * y el cierre (`sign-out.spec.ts`); ninguno llega a que caduque un token con la sesión abierta.
 *
 * ## Qué demuestra, y por qué no lo puede demostrar un unitario
 *
 * 1. **Caducar no es desconectar.** El token dura una hora; la sesión, seis meses de inactividad. Un
 *    unitario de `ResumeSession` comprueba que devuelve `active`, pero no que la pantalla siga
 *    diciendo «Conectada» ni que la siguiente escritura en la hoja funcione con el token nuevo.
 * 2. **Se renueva sin ventana de Google.** Es la razón de ser del backend: antes cada renovación
 *    exigía una ventana emergente, y el navegador la bloqueaba. Se comprueba mirando que **nadie
 *    vuelve a pedir el guion de `accounts.google.com`** después de conectar.
 * 3. **Renovar no abre otra sesión.** Un `sid` nuevo por cada hora llenaría Firestore de sesiones y,
 *    peor, cambiaría el número de sesión: cualquier operación en vuelo tiraría su resultado creyendo
 *    que ha entrado otra cuenta. Se comprueba con el recuento de sesiones del servicio y con que la
 *    hoja siga siendo la misma.
 * 4. **Un `401` en caliente sí desconecta, y no borra nada.** Es la otra mitad: perder la sesión no
 *    es cerrarla, así que el recetario tiene que seguir donde estaba.
 *
 * ## Por qué el reloj es falso
 *
 * Hay que hacer pasar una hora, y no hay ningún atajo honesto: la app decide renovar mirando
 * `Date.now()` contra la caducidad que declaró el proveedor (`Credential.isExpired`, con un margen de
 * un minuto). Acortar el token con `google.tokenLifetime()` no evita el problema: por debajo de ese
 * margen el token **nace caducado** y la app trata la sesión como inservible desde el primer momento
 * —lo contrario de lo que se quiere probar—, y por encima sigue habiendo que esperar de verdad, con
 * lo que el test dependería del reloj de la máquina.
 *
 * `page.clock` adelanta el reloj de la página sin tocar una línea de la app: la lógica que decide es
 * exactamente la de producción. Se instala **antes de navegar**, que es lo que exige Playwright.
 *
 * Instalarlo **no congela el tiempo**: los temporizadores siguen disparándose como siempre y la app
 * arranca con normalidad. Lo que congela es `pauseAt`, que aquí no se usa. `fastForward` da el salto y
 * dispara una sola vez lo que hubiera vencido en el intervalo — que es justo lo que hace un portátil
 * al que se le cierra la tapa una hora.
 */

/**
 * Lo que dura el token que emite el servicio. Adelantar esto lo caduca, con margen de sobra.
 *
 * En milisegundos y no como texto **a propósito**: el formato de `fastForward` es `"mm:ss"`, así que
 * `'01:00'` es **un minuto**, no una hora. Un número no se puede leer mal.
 */
const AN_HOUR_MS = 60 * 60 * 1000;

test.describe('Cuenta · el token caduca cada hora', () => {
  test('conectar → pasa la hora → comprobar la hoja renueva el token solo, sin ventana de Google ni sesión nueva → sincronizar escribe con el token renovado → el servicio olvida la sesión → la siguiente renovación desconecta y el recetario sigue intacto', async ({
    page,
    google,
    account,
    home,
    catalog,
  }) => {
    // Antes de cualquier navegación, o el reloj de la página seguiría siendo el de verdad.
    await page.clock.install();

    await account.goto();
    await account.connectAndWait();

    // El punto de partida, para poder afirmar después qué **no** volvió a pasar.
    const gisAlConectar = google.gisScriptRequestCount;
    expect(gisAlConectar, 'conectar carga el guion de Google una vez').toBeGreaterThan(0);
    expect(google.tokenRequestCount, 'conectar no reanuda nada: no hay sesión previa').toBe(0);
    expect(google.openSessionCount, 'conectar abre una sesión').toBe(1);

    const hoja = google.sheet;
    await expect(account.statusLabel).toHaveText('Al día');

    // ── Caso 1 · pasa la hora y el token caduca: la app pide otro sin que nadie se entere ────────
    await page.clock.fastForward(AN_HOUR_MS);

    // «Comprobar la hoja» es una ida y vuelta de verdad contra Sheets, así que necesita un token
    // vigente. Que conteste es la prueba de que el renovado sirve — no solo de que llegó.
    await account.check.click();
    await expect(account.checkSummary).toContainText('todo está al día');

    expect(google.tokenRequestCount, 'la caducidad se resuelve con UNA petición').toBe(1);
    expect(
      google.gisScriptRequestCount,
      'renovar NO puede volver a Google: esa ventana es la que el navegador bloquea',
    ).toBe(gisAlConectar);
    expect(google.openSessionCount, 'renovar no abre otra sesión: es la misma').toBe(1);

    // Y para el usuario no ha cambiado nada: la misma persona y la misma hoja.
    await expect(account.accountSummary).toContainText('Conectada');
    await expect(account.connectedAs(E2E_ACCOUNT.name)).toBeVisible();
    expect(google.sheets, 'la misma sesión sigue con la misma hoja').toHaveLength(1);

    // ── Caso 2 · el token renovado también sirve para escribir ───────────────────────────────────
    // Un cambio hecho fuera, como si viniera de otro aparato: la app tiene que bajarlo y dejar la
    // hoja al día. Es una escritura completa, no otra lectura.
    const insumos = hoja.tab('ingredients');
    const fila = insumos.rowOf('id', SUPPLIES.harina.id);
    expect(fila, 'el catálogo sembrado tiene que estar en la hoja').toBeGreaterThan(1);
    insumos.editRecord(fila, (registro) => {
      registro['name'] = 'Harina renovada E2E';
    });

    await account.syncAll.click();
    await expect(account.statusLabel).toHaveText('Al día');
    expect(insumos.dataRowCount, 'sincronizar con el token nuevo no duplica ni pierde filas').toBe(
      SUPPLY_COUNT,
    );
    expect(google.openSessionCount, 'seguimos en la misma sesión').toBe(1);

    // ── Caso 3 · el servicio olvida la sesión: la siguiente renovación SÍ desconecta ─────────────
    // Es lo que pasa cuando la persona retira el acceso desde su cuenta de Google.
    //
    // **Nadie pulsa nada, y ese es el hecho.** Al saltar el reloj vence el ciclo periódico de
    // sincronización (`SyncScheduler`, cada 120 s), que pide un token para su ronda, se encuentra el
    // `401` y cierra la sesión. Así que la app se entera sola, sin que el usuario toque la pantalla —
    // que es justo lo que tiene que pasar: enterarse solo cuando alguien pulsa un botón dejaría a
    // quien mira la pantalla creyendo que sigue conectado.
    google.expireSession();
    await page.clock.fastForward(AN_HOUR_MS);

    await expect(account.accountSummary).toContainText('Sin conectar');
    await expect(account.connect).toBeEnabled();
    // Y no queda nada operable: las tres acciones necesitan una sesión que ya no hay.
    await expect(account.check).toBeDisabled();
    await expect(account.syncAll).toBeDisabled();

    // ── Estado terminal · perder la sesión NO es cerrarla ────────────────────────────────────────
    // Cerrar sesión vacía el aparato; que el servicio la olvide, no. El recetario es del usuario.
    // Se llega por navegación de la app (sin recargar): recargar arrancaría la app de cero y taparía
    // justo lo que hay que ver — que los datos siguen ahí sin haber pasado por otra siembra.
    await account.backToKitchen.click();
    await expect(home.dock).toBeVisible();
    await home.station('Libro de recetas').click();
    await catalog.waitReady();

    const [queque] = RECIPES.Queques;
    await expect(catalog.recipe('Queques', queque).first()).toBeVisible();
  });

  /**
   * La otra forma de que una renovación no sirva: llega un token, pero **sin el permiso de Drive**.
   *
   * No es un `401`: el servicio reconoce la sesión y emite el token. Lo descarta la app
   * (`BackendAuthenticator.resume`), porque un token que no alcanza la hoja no sirve para lo único
   * que esta app hace con Google — y seguir con él daría un fallo mucho más tarde, al escribir, sin
   * relación visible con la causa.
   *
   * Va en su propio recorrido y no encadenado al de arriba porque **los dos acaban en una sesión
   * cerrada**: son dos ramas del mismo punto de partida que se excluyen, y la segunda no puede
   * empezar donde termina la primera.
   */
  test('conectar → pasa la hora → el token renovado llega sin el permiso de Drive → se descarta y la sesión se cierra → el recetario sigue intacto', async ({
    page,
    google,
    account,
    home,
    catalog,
  }) => {
    await page.clock.install();

    await account.goto();
    await account.connectAndWait();
    await expect(account.connectedAs(E2E_ACCOUNT.name)).toBeVisible();

    // El servicio contestará 200 con un token válido… al que le falta `drive.file`.
    google.refreshWithoutDrivePermission();
    await page.clock.fastForward(AN_HOUR_MS);

    // Se pidió el token y llegó: esto NO es «no te oigo» ni un 401.
    await expect.poll(() => google.tokenRequestCount, { timeout: 20_000 }).toBe(1);
    expect(google.openSessionCount, 'la sesión seguía viva en el servicio').toBe(1);

    // Y aun así la app se da por desconectada, porque con ese token no podría hacer su trabajo.
    await expect(account.accountSummary).toContainText('Sin conectar');
    await expect(account.connect).toBeEnabled();

    // Estado terminal: descartar un token no es cerrar sesión — los datos son del usuario.
    await account.backToKitchen.click();
    await expect(home.dock).toBeVisible();
    await home.station('Libro de recetas').click();
    await catalog.waitReady();

    const [queque] = RECIPES.Queques;
    await expect(catalog.recipe('Queques', queque).first()).toBeVisible();
  });
});
