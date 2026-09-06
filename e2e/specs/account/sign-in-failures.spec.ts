import { test, expect } from '../../fixtures/app-fixture';
import { E2E_ACCOUNT } from '../../support/google-double';

/**
 * **Las tres formas de que conectar no salga**, y que las tres se distingan.
 *
 * Hasta ahora el doble concedía la autorización siempre y el backend canjeaba siempre, así que la
 * rama de fallo de `SignIn` —la que publica `AuthenticationFailed` y relanza para que la pantalla
 * cuente el motivo— no se ejecutaba en ningún test. Los mensajes que ve el usuario cuando algo se
 * tuerce eran, literalmente, código que nadie había visto funcionar.
 *
 * ## Por qué importa que se distingan
 *
 * Los tres fallos ocurren en el **mismo paso** («Conectando con tu cuenta de Google») y comparten
 * el mismo remedio, así que la pantalla enseña el mismo encabezado y las mismas instrucciones. Lo
 * único que cambia es el motivo, y cada uno se arregla de una forma distinta:
 *
 * | Fallo | De quién es | Qué hay que hacer |
 * |---|---|---|
 * | La ventana se cierra o la bloquea el navegador | del navegador | permitir emergentes y repetir |
 * | El usuario deniega el permiso | de quien está delante | volver y aceptar la casilla |
 * | El backend rechaza el canje sin permiso de Drive | de la concesión | volver a consentir |
 *
 * Si los tres dijeran lo mismo, quien se queda fuera no tendría forma de saber por dónde salir. Por
 * eso este recorrido asserta **el texto del motivo**, no que «apareció un error».
 *
 * ## Y termina conectando
 *
 * Un test que acabara en «se ve el error» probaría medio flujo: lo que hay que demostrar es que
 * **de ahí se sale**. Los tres fallos son transitorios y el mismo botón de Reintentar los recorre,
 * así que el estado terminal es la cuenta conectada y el recetario en la hoja — sin recargar y sin
 * volver a `/cuenta`, desde el mismo aviso de error.
 */

/** El paso que se rompe en los tres casos. Es el encabezado del aviso. */
const STEP = 'Conectando con tu cuenta de Google';

test.describe('Cuenta · conectar cuando algo se tuerce', () => {
  test('la ventana se cierra → dice cómo desbloquearla → se deniega el permiso → dice que hace falta → el backend rechaza el canje sin Drive → dice que hay que volver a consentir → se concede → conecta y sube el recetario', async ({
    google,
    account,
  }) => {
    await account.goto();
    await expect(account.accountSummary).toContainText('Sin conectar');

    // ── Caso 1 · la ventana de Google no llega a abrirse, o se cierra ────────────────────────────
    await google.denyAuthorization('popup_closed');
    await account.connect.click();

    await expect(account.problems).toContainText(STEP);
    await expect(account.problems).toContainText('Se ha cerrado la ventana de Google');
    // El motivo es accionable: dice qué tocar en el navegador. Sin esto, «no se pudo conectar».
    await expect(account.problems).toContainText('permite las ventanas emergentes');

    // Se paró en el primer paso y no siguió: los otros tres ni se intentaron.
    await expect(account.steps).toHaveCount(4);
    await expect(account.steps.filter({ hasText: 'Hecho' })).toHaveCount(0);
    expect(google.openSessionCount, 'una ventana que no se abre no abre ninguna sesión').toBe(0);
    expect(google.sheets, 'ni crea ninguna hoja').toHaveLength(0);

    // ── Caso 2 · la ventana se abre y el usuario dice que no ─────────────────────────────────────
    // Otro motivo, y por eso otro texto: aquí no hay nada que desbloquear, hay que aceptar.
    await google.denyAuthorization('access_denied');
    await account.retry.click();

    await expect(account.problems).toContainText('Has denegado el permiso');
    await expect(account.problems).not.toContainText('Se ha cerrado la ventana de Google');
    expect(google.openSessionCount).toBe(0);

    // ── Caso 3 · Google concede, pero sin el permiso de Drive: lo para el backend ────────────────
    // El código llega y se canjea; quien se niega es el servicio de sesión, porque una concesión sin
    // Drive no sirve para lo único que esta app hace con Google. El mensaje es **suyo**, y llega
    // entero hasta la pantalla.
    await google.allowAuthorization();
    google.failNextExchange('missing_permission');
    await account.retry.click();

    await expect(account.problems).toContainText('No has concedido el permiso para crear la hoja');
    await expect(account.problems).toContainText('acepta la casilla');
    expect(google.openSessionCount, 'un canje rechazado no deja sesión abierta').toBe(0);
    expect(google.sheets).toHaveLength(0);

    // ── Estado terminal · desde el propio aviso se sale, y se conecta ────────────────────────────
    // Nada que restaurar: el rechazo del canje era de un solo uso y la autorización ya se concedió.
    await account.retry.click();

    await expect(account.ready).toBeVisible({ timeout: 30_000 });
    await expect(account.steps.filter({ hasText: 'Hecho' })).toHaveCount(4);
    await expect(account.problems).toHaveCount(0);

    await expect(account.accountSummary).toContainText('Conectada');
    await expect(account.connectedAs(E2E_ACCOUNT.name)).toBeVisible();
    await expect(account.statusLabel).toHaveText('Al día');
    expect(google.openSessionCount, 'y ahora sí hay una sesión').toBe(1);
    expect(google.sheets, 'una sola hoja pese a los tres fallos').toHaveLength(1);
  });
});
