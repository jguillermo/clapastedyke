import { test, expect } from '../../../fixtures/app-fixture';

/**
 * Arranque de la app en la vista `features/game/home`: la raíz redirige a `/home` y
 * el mundo 3D queda montado con su HUD operable.
 */
test.describe('Home 3D · arranque', () => {
  test.use({ webgl: true });

  test('/ → redirige a /home → canvas del mundo montado y dock operable', async ({
    page,
    home,
  }) => {
    await page.goto('/');

    await page.waitForURL('**/home');
    await expect(home.canvas).toBeVisible();
    await expect(home.dock).toBeVisible();
    await expect(home.station('Libro de recetas')).toBeEnabled();
  });

  test('/home directo → mundo montado con el canvas oculto a lectores de pantalla', async ({
    page,
    home,
  }) => {
    await page.goto('/home');

    await expect(home.canvas).toBeVisible();
    await expect(home.canvas).toHaveAttribute('aria-hidden', 'true');
    await expect(home.dock).toBeVisible();
  });

  test('recarga con datos ya sembrados → el mundo vuelve a montarse sin duplicar el HUD', async ({
    page,
    home,
  }) => {
    await home.goto();

    await page.reload();
    await page.waitForURL('**/home');

    await expect(home.canvas).toHaveCount(1);
    await expect(home.dock).toHaveCount(1);
    await expect(home.stations).toHaveCount(3);
  });
});
