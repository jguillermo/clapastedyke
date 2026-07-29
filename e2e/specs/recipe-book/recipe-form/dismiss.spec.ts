import { test, expect } from '../../../fixtures/app-fixture';
import { RECIPES, SUPPLIES } from '../../../support/seed';

/**
 * Salidas del formulario **sin guardar**: `Cancelar`, la × de la cabecera y Escape
 * (que lo gestiona el CDK Dialog). En los tres casos el estado terminal es el mismo:
 * el diálogo cerrado y el catálogo intacto.
 */
test.describe('Formulario de receta · descartar', () => {
  test('crear con datos a medias → Cancelar → se cierra sin añadir la receta', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Descartada por Cancelar E2E');
    await grid.fillExistingLine(0, SUPPLIES.harina.name, '100');
    await form.cancel.click();

    await form.waitClosed();
    expect(await catalog.recipeNamesIn('Queques')).toEqual([...RECIPES.Queques]);
  });

  test('crear con datos a medias → × de la cabecera → se cierra sin añadir la receta', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Descartada por la X E2E');
    await grid.fillExistingLine(0, SUPPLIES.huevos.name, '2');
    await form.close.click();

    await form.waitClosed();
    expect(await catalog.recipeNamesIn('Rellenos')).toEqual([...RECIPES.Rellenos]);
  });

  /**
   * OJO — comportamiento actual: Escape cierra el formulario **y además el libro**,
   * devolviendo al usuario a la cocina. El atajo del libro (`document:keydown`) se
   * ejecuta en el mismo evento en el que el CDK ya ha cerrado el diálogo, así que su
   * guarda `dialogOpen` ya vale `false` y también actúa. El test comprueba el
   * invariante que importa (no se guardó nada) recorriendo el flujo real: Escape →
   * vuelve la cocina → reabrir el libro → la receta no está.
   */
  test('crear con datos a medias → Escape → vuelve la cocina → reabrir el libro → la receta no está', async ({
    openCatalog,
    catalog,
    form,
    home,
    page,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Coberturas').click();
    await form.waitReady();
    await form.name.fill('Descartada por Escape E2E');
    await page.keyboard.press('Escape');
    await form.waitClosed();

    await expect(home.dock).toBeVisible();
    await home.station('Libro de recetas').click();
    await catalog.waitReady();

    expect(await catalog.recipeNamesIn('Coberturas')).toEqual([...RECIPES.Coberturas]);
  });

  test('editar y renombrar → Cancelar → la receta conserva su nombre original', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();

    await catalog.recipe('Queques', 'Bizcocho de Naranja').click();
    await form.waitReady();
    await form.name.fill('Nombre que no debe guardarse E2E');
    await form.cancel.click();

    await form.waitClosed();
    expect(await catalog.recipeNamesIn('Queques')).toEqual([...RECIPES.Queques]);
  });

  test('cerrar el formulario → el libro vuelve a ser operable', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.cancel.click();
    await form.waitClosed();

    await expect(catalog.suppliesButton).toBeEnabled();
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await expect(form.title).toHaveText('Nueva receta');
    await form.cancel.click();
    await form.waitClosed();
  });
});
