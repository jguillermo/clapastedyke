import { test, expect } from '../../fixtures/app-fixture';
import { SUPPLY_COUNT } from '../../support/seed';

/**
 * `features/sync-badge`: el aviso discreto de que algo tuyo aún no ha salido de este dispositivo.
 *
 * El requisito era «un indicador discreto cuando existan cambios pendientes de sincronizar», y
 * *discreto* es la parte que se prueba aquí: **cuando todo está al día no existe en el DOM**. Un aviso
 * permanente enseña a no mirarlo; que aparecer sea la señal es lo que le da valor.
 *
 * Para verlo hace falta que un cambio local se quede sin salir, así que el doble de Google **retiene**
 * sus respuestas: el ciclo arranca y no termina, que es exactamente lo que pasa con una red lenta. Se
 * retiene en vez de fallar a propósito — un fallo de recurso dejaría un error en la consola del
 * navegador, y la suite falla ante cualquiera (fixture `consoleErrors`), que es lo que se quiere.
 *
 * El aviso se monta en el armazón, fuera del `router-outlet`, así que se ve igual en la cocina que en
 * `/cuenta`; el journey lo comprueba pasando de una a otra **pulsándolo**, que es su única acción.
 */
test.describe('Aviso de sincronización', () => {
  test('al día no existe → insumo nuevo con la red retenida lo hace aparecer → pulsarlo lleva a /cuenta con 1 pendiente → vuelve la red → desaparece y el insumo está en la hoja', async ({
    google,
    connectAccount,
    account,
    home,
    catalog,
    supplies,
    syncBadge,
  }) => {
    await connectAccount();

    // ── Caso 1 · al día: el aviso no existe ──────────────────────────────────────────────────────
    await expect(account.pending).toHaveText('0');
    await syncBadge.waitInvisible(5_000);

    // ── Caso 2 · un cambio local que no puede salir hace aparecer el aviso ───────────────────────
    google.hold();

    await account.backToKitchen.click();
    await expect(home.dock).toBeVisible();
    await home.station('Libro de recetas').click();
    await catalog.waitReady();
    await catalog.suppliesButton.click();
    await supplies.waitReady();
    await supplies.list.addSupply('Tocino E2E', '250', '11.90');
    await supplies.close.click();
    await supplies.waitClosed();

    // El mensaje depende de si el rebote de cinco segundos ya lanzó el ciclo (que ahora no puede
    // terminar); las dos formas dicen lo mismo: esto todavía no ha salido de aquí.
    await syncBadge.waitFor(/1 sin subir|Sincronizando/);

    // ── Caso 3 · pulsarlo lleva al estado de la sincronización ───────────────────────────────────
    await syncBadge.button.click();
    await expect(account.root).toBeVisible();
    await expect(account.pending).toHaveText('1');

    // ── Caso 4 · vuelve la red: el aviso desaparece y el cambio está en la hoja ──────────────────
    google.resume();

    await syncBadge.waitInvisible();
    await expect(account.pending).toHaveText('0');
    await expect(account.statusLabel).toHaveText('Al día');

    // Se espera por la fila: el ciclo que estaba retenido leyó lo local ANTES del alta, así que puede
    // ser el siguiente el que la suba (el planificador repite al acabar si algo disparó mientras corría).
    // La cola se vacía con el primero, así que el aviso puede irse un instante antes que la fila llegue.
    const insumos = google.sheet.tab('Insumos');
    await expect
      .poll(() => insumos.rowOf('Nombre', 'Tocino E2E'), { timeout: 20_000 })
      .toBeGreaterThan(1);
    expect(insumos.dataRowCount).toBe(SUPPLY_COUNT + 1);
  });
});
