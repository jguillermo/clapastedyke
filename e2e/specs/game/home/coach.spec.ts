import { test, expect } from '../../../fixtures/app-fixture';

const COACH_TEXT = 'Bienvenida a tu cocina. Antes de hornear, armemos tu libro de recetas.';

/**
 * Globo del chef coach: aparece cuando termina el `flyIn` de la cámara, se oculta al
 * abrir el libro (para no tapar la lectura) y vuelve al regresar a la cocina.
 */
test.describe('Home 3D · globo del chef coach', () => {
  test.use({ webgl: true });

  test('flyIn terminado → el globo saluda como región de estado', async ({ openHome }) => {
    const home = await openHome();

    await expect(home.coach).toBeVisible();
    await expect(home.coach).toHaveText(COACH_TEXT);
  });

  test('abrir el libro → el globo se oculta → volver → el globo reaparece', async ({
    openHome,
    home,
    book,
  }) => {
    await openHome();
    await expect(home.coach).toBeVisible();

    await home.station('Libro de recetas').click();
    await book.waitReady();
    await expect(home.coach).toHaveCount(0);

    await book.back.click();
    await expect(home.coach).toBeVisible();
    await expect(home.coach).toHaveText(COACH_TEXT);
  });
});
