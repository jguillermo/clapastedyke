import { test, expect } from '../../fixtures/app-fixture';
import { E2E_ACCOUNT } from '../../support/google-double';
import { RECIPES } from '../../support/seed';

/**
 * Qué pasa con la sesión cuando la app arranca **sin poder hablar con el servicio de sesión**, y qué
 * pasa cuando ese servicio contesta que la sesión ya no vale. Son dos desenlaces que antes se veían
 * exactamente igual —«Conectar con Google»— y que se arreglan de forma opuesta: uno se espera, el
 * otro exige volver a entrar.
 *
 * Todo desde `features/account`, que es la vista donde el usuario ve su sesión y donde están las tres
 * acciones que dependen de ella.
 */
test.describe('Cuenta · sesión sin conexión', () => {
  test('conectar → sin cobertura → recargar → la sesión sigue viva y las acciones bloqueadas → vuelve la red → recargar → conectada → el servicio olvida la sesión → recargar → pide conectar y el recetario sigue intacto', async ({
    connectAccount,
    google,
    account,
    openCatalog,
    catalog,
  }) => {
    await connectAccount();
    await expect(account.connectedAs(E2E_ACCOUNT.name)).toBeVisible();

    // ── 1 · Sin cobertura, recargar NO echa a nadie ──────────────────────────────────────────────
    google.cutSessionService();
    await account.reload();

    await expect(account.accountSummary).toContainText('sin conexión');
    // Lo que este recorrido existe para impedir: ofrecerle conectar a quien ya tiene sesión.
    await expect(account.connect).toHaveCount(0);

    // ── 2 · Y no se deja hacer nada que necesite al servidor ─────────────────────────────────────
    // Cerrar sesión borra el dispositivo entero: sin poder avisar antes, se bloquea en vez de dejar
    // pulsar y fallar a mitad.
    await expect(account.disconnect).toBeDisabled();
    await expect(account.syncAll).toBeDisabled();
    await expect(account.check).toBeDisabled();

    // ── 3 · Vuelve la red: la sesión se recupera en la siguiente carga ───────────────────────────
    // No hay reintento automático, y es deliberado: se vuelve a pedir al recargar, y nada más.
    google.restoreSessionService();
    await account.reload();

    await expect(account.connectedAs(E2E_ACCOUNT.name)).toBeVisible();
    await expect(account.syncAll).toBeEnabled();
    await expect(account.disconnect).toBeEnabled();

    // ── 4 · El servicio ya no reconoce la sesión: eso SÍ desconecta ──────────────────────────────
    google.expireSession();
    await account.reload();

    await expect(account.connect).toBeEnabled();
    await expect(account.accountSummary).toContainText('Sin conectar');

    // ── 5 · Estado terminal: perder la sesión NO es cerrar sesión ────────────────────────────────
    // Cerrar sesión vacía el dispositivo; que caduque, no. El recetario es del usuario, no de la
    // sesión, y tiene que seguir donde estaba.
    const [queque] = RECIPES.Queques;
    await openCatalog();
    await expect(catalog.recipe('Queques', queque).first()).toBeVisible();
  });
});
