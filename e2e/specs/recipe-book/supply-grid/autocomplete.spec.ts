import { test, expect } from '../../../fixtures/app-fixture';
import { SUPPLIES } from '../../../support/seed';

/**
 * Combobox de la columna Ingrediente (`migo-combobox` dentro de `app-supply-grid`).
 *
 * Tiene dos modos: **fantasma** cuando lo tecleado tiene una única coincidencia que
 * empieza por él (se acepta con Enter y el foco salta a Cantidad), y **desplegable**
 * cuando hay varias coincidencias por contenido. Cada test cierra el flujo guardando
 * la receta, que es el estado terminal observable.
 */
test.describe('Grilla de ingredientes · autocompletado', () => {
  test('prefijo con una sola coincidencia → Enter acepta el fantasma → foco en Cantidad → guardar → receta con ese insumo', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Fantasma aceptado E2E');

    await grid.acceptGhostName(0, 'Harina');
    await expect(grid.nameInput(0)).toHaveValue(SUPPLIES.harina.name);
    await grid.quantityInput(0).fill('300');
    await form.save.click();
    await form.waitClosed();

    await catalog.recipe('Queques', 'Fantasma aceptado E2E').click();
    await form.waitReady();
    await expect(grid.nameInput(0)).toHaveValue(SUPPLIES.harina.name);
  });

  test('prefijo con varias coincidencias → se abre el desplegable → elegir una → guardar → receta con la elegida', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Desplegable E2E');

    await grid.nameInput(0).click();
    await grid.nameInput(0).fill('Azúcar');
    await expect(grid.listbox).toBeVisible();
    await expect(grid.options).toHaveCount(3);

    await grid.option(SUPPLIES.azucarBlanca.name).click();
    await expect(grid.nameInput(0)).toHaveValue(SUPPLIES.azucarBlanca.name);
    await grid.quantityInput(0).fill('120');
    await form.save.click();
    await form.waitClosed();

    await catalog.recipe('Queques', 'Desplegable E2E').click();
    await form.waitReady();
    await expect(grid.nameInput(0)).toHaveValue(SUPPLIES.azucarBlanca.name);
  });

  test('desplegable abierto → flechas y Enter eligen con teclado → guardar → receta con la elegida', async ({
    openCatalog,
    catalog,
    form,
    grid,
    page,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Teclado en el desplegable E2E');

    await grid.nameInput(0).click();
    await grid.nameInput(0).fill('Azúcar');
    await expect(grid.listbox).toBeVisible();

    // La flecha mueve la opción activa; se lee cuál quedó marcada antes de confirmar.
    const chosen = await grid.moveActiveOption(0, 'ArrowDown');
    await page.keyboard.press('Enter');

    await expect(grid.nameInput(0)).toHaveValue(chosen);
    await grid.quantityInput(0).fill('80');
    await form.save.click();
    await form.waitClosed();

    await expect(catalog.recipe('Queques', 'Teclado en el desplegable E2E')).toBeVisible();
  });

  test('nombre escrito completo → no hay nada que autocompletar → guardar → receta con ese insumo', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Nombre completo E2E');

    await grid.nameInput(0).fill(SUPPLIES.huevos.name);
    await grid.quantityInput(0).fill('6');
    await expect(grid.costButton(0)).not.toHaveText('＋ precio');
    await form.save.click();
    await form.waitClosed();

    await expect(catalog.recipe('Rellenos', 'Nombre completo E2E')).toBeVisible();
  });

  test('escribir en el desplegable y pulsar Escape → se cierra sin elegir → guardar con lo tecleado', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Escape en el desplegable E2E');

    await grid.nameInput(0).click();
    await grid.nameInput(0).fill('Azúcar');
    await expect(grid.listbox).toBeVisible();
    await grid.nameInput(0).press('Escape');
    await expect(grid.listbox).toHaveCount(0);

    // Lo tecleado sigue en el campo y la receta se guarda con el insumo completado a mano.
    await grid.nameInput(0).fill(SUPPLIES.azucarImpalpable.name);
    await grid.quantityInput(0).fill('50');
    await form.save.click();
    await form.waitClosed();

    await expect(catalog.recipe('Queques', 'Escape en el desplegable E2E')).toBeVisible();
  });
});
