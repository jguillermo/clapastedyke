import { test, expect } from '../../fixtures/app-fixture';
import { E2E_ACCOUNT } from '../../support/google-double';

/**
 * `/cuenta` a **375px**, que es donde de verdad se usa la app.
 *
 * Dos cosas a la vez, y las dos solo se ven aquí:
 *
 * ## 1. El respaldo de la cookie, que es lo que sostiene la sesión en Safari y en iOS
 *
 * La sesión viaja por **dos** vías: una cookie `HttpOnly` `__session` y, en paralelo, el mismo
 * identificador en `Authorization: Bearer`. La cookie es la vía preferida —ni la app ni un XSS pueden
 * leerla—, pero la función vive en otro dominio que la app, así que es **cookie de terceros**, y
 * Safari e iOS la bloquean aunque esté bien formada. Sin el respaldo, en esos navegadores recargar
 * echaría al usuario: exactamente el fallo que el backend vino a arreglar.
 *
 * Ese respaldo no tiene ninguna manifestación visible, así que un test de escritorio lo da por bueno
 * sin comprobarlo. Aquí se mira **la cabecera que salió del navegador** (`google.lastAuthRequest`).
 *
 * Y hay una segunda red de seguridad, por construcción: el doble **no modela cookies** —el estado de
 * las sesiones vive en el proceso del test— así que la cabecera es su única vía. El día que la app
 * dejara de mandarla, no fallaría solo esta aserción: se caerían todos los recorridos de sesión de la
 * suite. En un navegador de verdad ese fallo solo se vería en iOS, que es donde nadie mira hasta que
 * es tarde.
 *
 * ## 2. La regla dura mobile-first
 *
 * Sin desbordamiento horizontal y con todos los targets táctiles a 44px o más — antes y después de
 * conectar, porque la tarjeta cambia entera: aparecen la cuenta, el enlace a la hoja, la lista de
 * pasos y tres botones donde había uno.
 */

/** El mínimo del tema (`--touch-min`, la utilidad `min-h-11`). */
const TOUCH_MIN = 44;

test.describe('Cuenta · móvil 375px', () => {
  test('sin conectar no desborda y el botón es táctil → conectar al toque → la tarjeta con sesión tampoco desborda y sus acciones son táctiles → recargar sigue conectada, y la reanudación viajó en la cabecera', async ({
    google,
    account,
    page,
  }) => {
    await account.goto();

    /** Que el documento no se pueda arrastrar a los lados. Se mide varias veces: la vista cambia. */
    const noHorizontalOverflow = async (): Promise<void> => {
      const [scrollWidth, innerWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        window.innerWidth,
      ]);
      expect(scrollWidth, 'la vista no puede desbordar a lo ancho').toBeLessThanOrEqual(innerWidth);
    };

    // ── Caso 1 · sin cuenta: se mide, no se toca nada ────────────────────────────────────────────
    await expect(account.accountSummary).toContainText('Sin conectar');
    await noHorizontalOverflow();

    const connectBox = (await account.connect.boundingBox())!;
    expect(connectBox.height, 'la única acción tiene que ser táctil').toBeGreaterThanOrEqual(
      TOUCH_MIN,
    );

    // ── Caso 2 · conectar con el dedo ────────────────────────────────────────────────────────────
    await account.connect.tap();
    await expect(account.ready).toBeVisible({ timeout: 30_000 });
    await expect(account.steps.filter({ hasText: 'Hecho' })).toHaveCount(4);
    await expect(account.connectedAs(E2E_ACCOUNT.name)).toBeVisible();

    // ── Caso 3 · la tarjeta con sesión es otra vista, y también tiene que caber ──────────────────
    await noHorizontalOverflow();
    for (const [label, action] of [
      ['Comprobar la hoja', account.check],
      ['Sincronizar todo', account.syncAll],
      ['Cerrar sesión', account.disconnect],
    ] as const) {
      const box = (await action.boundingBox())!;
      expect(box.height, `«${label}» tiene que ser un target táctil`).toBeGreaterThanOrEqual(
        TOUCH_MIN,
      );
    }

    // ── Estado terminal · recargar no echa a nadie, y se ve POR DÓNDE volvió ─────────────────────
    await account.reload();

    await expect(account.accountSummary).toContainText('Conectada');
    await expect(account.connectedAs(E2E_ACCOUNT.name)).toBeVisible();
    await noHorizontalOverflow();

    const resumed = google.lastAuthRequest!;
    expect(resumed.url, 'reanudar es un POST a /refresh, sin ventana').toContain('/refresh');
    expect(resumed.method).toBe('POST');
    expect(
      resumed.headers['authorization'],
      'sin este respaldo la sesión no sobreviviría a una recarga en Safari ni en iOS',
    ).toMatch(/^Bearer .+/);
  });
});
