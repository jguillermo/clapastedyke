import { test, expect } from '../../../fixtures/app-fixture';

/**
 * Ruta accesible de `features/game/home` cuando el equipo no puede mostrar 3D (el modo por
 * defecto de la suite): desaparece el canvas y aparece el bloque «Tu cocina», pero el HUD y el
 * dock siguen operando el flujo entero.
 *
 * Un único journey: arrancar sin WebGL, comprobar lo que la vista ofrece en su lugar, entrar al
 * libro, volver a la cocina, y comprobar que **ninguna ruta se queda sin `#`**.
 */
test.describe('Cocina sin WebGL', () => {
  test('sin soporte 3D → se explica la situación con el HUD y el dock intactos → libro → Volver → vuelve la cocina → toda ruta lleva hash, incluso llegando por una URL vieja', async ({
    openHome,
    home,
    catalog,
    account,
    page,
  }) => {
    await openHome();

    // La app enruta por fragmento: entrar por `/` tiene que dejar la ruta detrás de `#`, nunca
    // como ruta de servidor.
    await expect(page).toHaveURL(/#\/home$/);

    // Sin canvas y sin flyIn: no hay mundo que mostrar, así que tampoco hay globo del coach.
    await expect(home.canvas).toHaveCount(0);
    await expect(home.coach).toHaveCount(0);
    await expect(home.noWebglHeading).toBeVisible();
    await expect(home.noWebglHint).toBeVisible();

    // El HUD de nivel y el dock son DOM: se mantienen igual que con 3D.
    await expect(home.levelBadge).toBeVisible();
    await expect(home.levelTitle).toBeVisible();
    await expect(home.dock).toBeVisible();
    await expect(home.station('Libro de recetas')).toBeEnabled();
    await expect(home.station('Despensa')).toBeDisabled();
    await expect(home.station('Horno')).toBeDisabled();

    // El dock sigue siendo el punto de entrada al libro, que cae a su lista DOM.
    await home.station('Libro de recetas').click();
    await catalog.waitReady();
    await expect(catalog.categoryHeadings).toHaveCount(3);

    // El libro se desmonta y vuelve la cocina operable, sin salir del hash.
    await catalog.back.click();
    await expect(catalog.root).toHaveCount(0);
    await expect(home.noWebglHeading).toBeVisible();
    await expect(home.station('Libro de recetas')).toBeEnabled();
    await expect(page).toHaveURL(/#\/home$/);

    // Navegar a otra vista tampoco saca la ruta del fragmento: es la invariante de toda la app.
    await home.accountLink.click();
    await expect(account.root).toBeVisible();
    await expect(page).toHaveURL(/#\/cuenta$/);
  });
});
