import { test, expect } from '../../../fixtures/app-fixture';

const COACH_TEXT = 'Bienvenida a tu cocina. Antes de hornear, armemos tu libro de recetas.';

/**
 * Vista `features/game/home` con el mundo 3D montado, recorrida como **dos journeys completos**:
 * uno de arranque y superficie (redirección, canvas, HUD, coach, dock y estaciones bloqueadas,
 * hasta la recarga) y otro del ciclo de vida del libro (abrir por teclado, volver, reabrir,
 * Escape y clics repetidos).
 *
 * No hay tests de estado suelto: cada uno arranca la app **una sola vez** y encadena todos sus
 * casos dentro de la misma sesión, que es lo que hace la suite barata.
 */
test.describe('Cocina 3D', () => {
  test.use({ webgl: true });

  test('/ → redirige a /home → canvas, HUD y coach montados → las estaciones bloqueadas no abren nada → recargar → nada se duplica', async ({
    page,
    home,
    book,
  }) => {
    await page.goto('/');
    await page.waitForURL('**/home');

    // El mundo se pinta en el canvas, que queda oculto a lectores de pantalla.
    await expect(home.canvas).toBeVisible();
    await expect(home.canvas).toHaveAttribute('aria-hidden', 'true');

    // HUD del Nivel 0: un único landmark con la insignia y el título.
    await expect(home.hud).toHaveCount(1);
    await expect(home.levelBadge).toBeVisible();
    await expect(home.levelTitle).toHaveText('El libro de recetas en blanco');

    // El globo del coach aparece al terminar el flyIn.
    await expect(home.coach).toHaveText(COACH_TEXT);

    // Dock: la ruta accesible, con las tres estaciones en orden.
    await expect(home.stations).toHaveCount(3);
    await expect(home.stations.nth(0)).toContainText('Libro de recetas');
    await expect(home.stations.nth(1)).toContainText('Despensa');
    await expect(home.stations.nth(2)).toContainText('Horno');

    const recipeBook = home.station('Libro de recetas');
    await expect(recipeBook).toBeEnabled();
    await expect(recipeBook).not.toHaveAttribute('aria-disabled', 'true');
    await expect(recipeBook.getByLabel('se desbloquea más adelante')).toHaveCount(0);

    // Fase 0: Despensa y Horno están con candado y un clic forzado no debe abrir nada.
    for (const label of ['Despensa', 'Horno'] as const) {
      const station = home.station(label);
      await expect(station).toBeDisabled();
      await expect(station).toHaveAttribute('aria-disabled', 'true');
      await expect(station.getByLabel('se desbloquea más adelante')).toBeVisible();
      await station.click({ force: true });
      await expect(book.root).toHaveCount(0);
    }
    await expect(home.dock).toBeVisible();

    // Estado terminal: con los datos ya sembrados, el mundo se remonta sin duplicar el HUD.
    await page.reload();
    await page.waitForURL('**/home');
    await expect(home.canvas).toHaveCount(1);
    await expect(home.dock).toHaveCount(1);
    await expect(home.stations).toHaveCount(3);
  });

  test('cocina → Enter en la estación abre el libro y oculta el coach → Volver → reabrir → Escape → clics repetidos no lo duplican', async ({
    openHome,
    home,
    book,
    page,
  }) => {
    await openHome();
    await expect(home.coach).toBeVisible();

    // El dock es enfocable y se opera con teclado.
    const station = home.station('Libro de recetas');
    await station.focus();
    await expect(station).toBeFocused();
    await station.press('Enter');
    await book.waitReady();

    // El libro cubre la cocina: el globo se retira para no tapar la lectura.
    await expect(book.pager).toBeVisible();
    await expect(home.coach).toHaveCount(0);

    await book.back.click();
    await expect(book.root).toHaveCount(0);
    await expect(home.canvas).toBeVisible();
    await expect(home.coach).toHaveText(COACH_TEXT);
    await expect(home.levelBadge).toBeVisible();

    // Reabrir remonta el libro una sola vez (ni canvas ni raíz duplicados).
    await station.click();
    await book.waitReady();
    await expect(book.root).toHaveCount(1);
    await expect(book.canvas).toHaveCount(1);

    // Escape es la otra salida del libro.
    await page.keyboard.press('Escape');
    await expect(book.root).toHaveCount(0);
    await expect(home.coach).toBeVisible();

    // Estado terminal: pulsar dos veces seguidas la estación deja un único libro montado.
    await station.click();
    await station.click({ force: true });
    await book.waitReady();
    await expect(book.root).toHaveCount(1);
  });
});
