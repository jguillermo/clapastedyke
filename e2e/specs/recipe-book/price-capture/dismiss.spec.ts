import { test, expect } from '../../../fixtures/app-fixture';
import type { RecipeBookFallbackPage } from '../../../pages/recipe-book-fallback.page';
import type { RecipeFormPage } from '../../../pages/recipe-form.page';
import type { SupplyGridPage } from '../../../pages/supply-grid.page';

/** Nombre del insumo nuevo que se usa en todos los casos de este spec. */
const NEW_SUPPLY = 'Insumo sin precio E2E';

/**
 * Abre una receta nueva en Rellenos con una línea de insumo **nuevo** (sin precio) y
 * deja la captura de precio abierta, lista para descartarla.
 */
async function openPriceCaptureFor(
  recipeName: string,
  context: {
    openCatalog: () => Promise<RecipeBookFallbackPage>;
    catalog: RecipeBookFallbackPage;
    form: RecipeFormPage;
    grid: SupplyGridPage;
  },
): Promise<void> {
  const { openCatalog, catalog, form, grid } = context;
  await openCatalog();
  await catalog.newRecipeIn('Rellenos').click();
  await form.waitReady();
  await form.name.fill(recipeName);
  await grid.fillNewLine(0, NEW_SUPPLY, '50');
  await grid.costButton(0).click();
}

/**
 * Salidas de la captura de precio sin confirmar: `Cancelar`, Escape y un clic en el
 * backdrop del overlay. En los tres casos el insumo sigue sin precio y la receta no se
 * puede guardar hasta que se le pone uno — el flujo se cierra poniéndolo.
 */
test.describe('Captura de precio · descartar', () => {
  test('captura abierta → Cancelar → el insumo sigue sin precio → poner precio → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
  }) => {
    await openPriceCaptureFor('Cancelar la captura E2E', { openCatalog, catalog, form, grid });

    await priceCapture.cancel.click();
    await expect(priceCapture.root).toHaveCount(0);
    await expect(grid.costButton(0)).toHaveText('＋ precio');

    await grid.costButton(0).click();
    await priceCapture.setPurchase('100', '5');
    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Rellenos', 'Cancelar la captura E2E')).toBeVisible();
  });

  /**
   * OJO — Escape con la captura abierta es **no determinista**: el mismo evento cierra siempre el
   * popover, pero *a veces* cierra además el diálogo de receta (y con él el libro, porque el atajo del
   * libro corre cuando su guarda `dialogOpen` ya está liberada). Por eso el test solo asserta lo
   * invariante —el popover se cierra y **nada se guardó**— y normaliza el estado recargando la app en
   * vez de suponer en qué vista quedó el usuario.
   */
  test('captura abierta → Escape → nada queda guardado → rehacer con precio → aparece listada', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
    home,
    page,
  }) => {
    await openPriceCaptureFor('Escape en la captura E2E', { openCatalog, catalog, form, grid });

    await page.keyboard.press('Escape');
    await expect(priceCapture.root).toHaveCount(0);

    // Recargar es determinista pase lo que pase con los overlays; además prueba que no se persistió.
    await home.goto();
    await home.station('Libro de recetas').click();
    await catalog.waitReady();
    expect(await catalog.recipeNamesIn('Rellenos')).not.toContain('Escape en la captura E2E');

    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Escape en la captura E2E');
    await grid.fillNewLine(0, NEW_SUPPLY, '50');
    await grid.costButton(0).click();
    await priceCapture.setPurchase('100', '5');
    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Rellenos', 'Escape en la captura E2E')).toBeVisible();
  });

  test('captura abierta → clic fuera (backdrop) → el insumo sigue sin precio → poner precio → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
  }) => {
    await openPriceCaptureFor('Clic fuera de la captura E2E', { openCatalog, catalog, form, grid });

    await priceCapture.dismissByBackdrop();
    await expect(priceCapture.root).toHaveCount(0);
    await expect(grid.costButton(0)).toHaveText('＋ precio');

    await grid.costButton(0).click();
    await priceCapture.setPurchase('100', '5');
    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Rellenos', 'Clic fuera de la captura E2E')).toBeVisible();
  });

  test('insumo nuevo sin precio → Guardar → la grilla pide el precio → ponerlo → guardar', async ({
    openCatalog,
    catalog,
    form,
    grid,
    priceCapture,
  }) => {
    await openCatalog();
    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Falta el precio E2E');
    await grid.fillNewLine(0, 'Insumo impago E2E', '30');

    await form.save.click();
    await expect(grid.error).toHaveText('Falta el precio de "Insumo impago E2E". Tócalo en la columna Costo.');
    await expect(form.root).toBeVisible();

    await grid.costButton(0).click();
    await priceCapture.setPurchase('300', '9');
    await form.save.click();
    await form.waitClosed();

    await expect(catalog.recipe('Rellenos', 'Falta el precio E2E')).toBeVisible();
  });
});
