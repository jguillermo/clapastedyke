import { test, expect } from '../../../fixtures/app-fixture';

/**
 * Dock de estaciones: es la **ruta accesible** del mundo 3D y opera el flujo sin
 * depender del canvas. En la Fase 0 solo el libro de recetas está desbloqueado;
 * Despensa y Horno quedan inertes con su candado.
 */
test.describe('Home 3D · dock de estaciones', () => {
  test.use({ webgl: true });

  test('mundo cargado → el dock lista las tres estaciones en orden', async ({ openHome }) => {
    const home = await openHome();

    await expect(home.stations).toHaveCount(3);
    await expect(home.stations.nth(0)).toContainText('Libro de recetas');
    await expect(home.stations.nth(1)).toContainText('Despensa');
    await expect(home.stations.nth(2)).toContainText('Horno');
  });

  test('estación activa → el libro de recetas está habilitado y sin candado', async ({
    openHome,
  }) => {
    const home = await openHome();
    const station = home.station('Libro de recetas');

    await expect(station).toBeEnabled();
    await expect(station).not.toHaveAttribute('aria-disabled', 'true');
    await expect(station.getByLabel('se desbloquea más adelante')).toHaveCount(0);
  });

  test.describe('estaciones bloqueadas de la Fase 0', () => {
    for (const label of ['Despensa', 'Horno'] as const) {
      test(`${label} → deshabilitada con candado → clic forzado → no abre nada`, async ({
        openHome,
        home,
        book,
      }) => {
        await openHome();
        const station = home.station(label);

        await expect(station).toBeDisabled();
        await expect(station).toHaveAttribute('aria-disabled', 'true');
        await expect(station.getByLabel('se desbloquea más adelante')).toBeVisible();

        // Un clic forzado sobre un botón deshabilitado no debe abrir ninguna vista.
        await station.click({ force: true });
        await expect(book.root).toHaveCount(0);
        await expect(home.dock).toBeVisible();
      });
    }
  });

  test('dock enfocable por teclado → Enter en el libro de recetas → se abre el libro', async ({
    openHome,
    home,
    book,
  }) => {
    await openHome();

    await home.station('Libro de recetas').focus();
    await expect(home.station('Libro de recetas')).toBeFocused();
    await home.station('Libro de recetas').press('Enter');

    await book.waitReady();
    await expect(book.root).toBeVisible();
  });
});
