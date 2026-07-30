import { test, expect } from '../../../fixtures/app-fixture';

/**
 * Ruta accesible de la cocina cuando el equipo no puede mostrar 3D: desaparece el
 * canvas y aparece el bloque «Tu cocina», pero el dock sigue operando el flujo
 * completo (es el requisito de la vista: sin WebGL se muestra solo el dock).
 */
test.describe('Home 3D · sin WebGL', () => {
  test('sin soporte 3D → no hay canvas → se explica la situación y el dock sigue operable', async ({
    openHome,
  }) => {
    const home = await openHome();

    await expect(home.canvas).toHaveCount(0);
    await expect(home.noWebglHeading).toBeVisible();
    await expect(home.noWebglHint).toBeVisible();
    await expect(home.dock).toBeVisible();
    await expect(home.station('Libro de recetas')).toBeEnabled();
  });

  test('sin soporte 3D → no se muestra el globo del coach (no hubo flyIn)', async ({
    openHome,
  }) => {
    const home = await openHome();

    await expect(home.noWebglHeading).toBeVisible();
    await expect(home.coach).toHaveCount(0);
  });

  test('sin soporte 3D → el HUD de nivel se mantiene', async ({ openHome }) => {
    const home = await openHome();

    await expect(home.levelBadge).toBeVisible();
    await expect(home.levelTitle).toBeVisible();
  });

  test('sin soporte 3D → dock → el libro abre su lista DOM → Volver → vuelve la cocina', async ({
    openHome,
    home,
    catalog,
  }) => {
    await openHome();

    await home.station('Libro de recetas').click();
    await catalog.waitReady();
    await expect(catalog.categoryHeadings).toHaveCount(3);

    await catalog.back.click();

    await expect(catalog.root).toHaveCount(0);
    await expect(home.noWebglHeading).toBeVisible();
    await expect(home.station('Libro de recetas')).toBeEnabled();
  });

  test('sin soporte 3D → las estaciones bloqueadas siguen bloqueadas', async ({ openHome }) => {
    const home = await openHome();

    await expect(home.station('Despensa')).toBeDisabled();
    await expect(home.station('Horno')).toBeDisabled();
  });
});
