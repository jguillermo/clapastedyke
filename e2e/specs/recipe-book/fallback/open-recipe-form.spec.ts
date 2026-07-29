import { test, expect } from '../../../fixtures/app-fixture';
import { CATEGORIES, GLASEADO, RECIPES } from '../../../support/seed';

/**
 * Puntos de entrada al formulario de receta desde la lista accesible: el botón
 * `Nuevo` de cada categoría (crear, con la categoría fija) y el botón de cada receta
 * (editar, precargada). Cada test cierra el ciclo dejando el formulario cerrado.
 */
test.describe('Libro de recetas · abrir el formulario desde la lista', () => {
  test.describe('crear en cada categoría', () => {
    for (const category of CATEGORIES) {
      test(`Nuevo en ${category} → formulario en blanco con la categoría fija → Cancelar → se cierra`, async ({
        openCatalog,
        catalog,
        form,
      }) => {
        await openCatalog();

        await catalog.newRecipeIn(category).click();
        await form.waitReady();

        await expect(form.title).toHaveText('Nueva receta');
        await expect(form.subtitle).toHaveText(category);
        await expect(form.name).toHaveValue('');

        await form.cancel.click();
        await form.waitClosed();
        await expect(catalog.newRecipeIn(category)).toBeVisible();
      });
    }
  });

  test('receta de la lista → formulario de edición con su nombre → Cancelar → se cierra', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();

    await catalog.recipe(GLASEADO.category, GLASEADO.name).click();
    await form.waitReady();

    await expect(form.title).toHaveText(GLASEADO.name);
    await expect(form.subtitle).toHaveText(GLASEADO.category);
    await expect(form.name).toHaveValue(GLASEADO.name);

    await form.cancel.click();
    await form.waitClosed();
    await expect(catalog.recipe(GLASEADO.category, GLASEADO.name)).toBeVisible();
  });

  test('dos recetas homónimas en categorías distintas → cada una abre la suya', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    // «Crema Chantilly» y «Ganache de Chocolate» existen en Rellenos y en Coberturas.
    const shared = 'Crema Chantilly';
    expect(RECIPES.Rellenos).toContain(shared);
    expect(RECIPES.Coberturas).toContain(shared);
    await openCatalog();

    await catalog.recipe('Rellenos', shared).click();
    await form.waitReady();
    await expect(form.subtitle).toHaveText('Rellenos');
    await form.cancel.click();
    await form.waitClosed();

    await catalog.recipe('Coberturas', shared).click();
    await form.waitReady();
    await expect(form.subtitle).toHaveText('Coberturas');
    await form.cancel.click();
    await form.waitClosed();
  });

  test('formulario abierto → el diálogo tiene nombre accesible → Cancelar → se cierra', async ({
    openCatalog,
    catalog,
    form,
    page,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();

    await expect(page.locator('[aria-label="Nueva receta"]')).toBeVisible();

    await form.cancel.click();
    await form.waitClosed();
  });
});
