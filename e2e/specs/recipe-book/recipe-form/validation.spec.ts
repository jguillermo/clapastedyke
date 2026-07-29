import { test, expect } from '../../../fixtures/app-fixture';
import { RECIPES, SUPPLIES } from '../../../support/seed';

/**
 * Validación del formulario de receta. El botón `Guardar` depende del nombre; los
 * ingredientes los valida la grilla al enviar. Ningún test termina en «apareció el
 * error»: se corrige el motivo y se llega a guardar (o se descarta y el catálogo
 * queda intacto).
 */
test.describe('Formulario de receta · validación', () => {
  test('formulario en blanco → Guardar deshabilitado → escribir nombre → se habilita', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await expect(form.save).toBeDisabled();

    await form.name.fill('Con nombre E2E');
    await expect(form.save).toBeEnabled();

    await form.cancel.click();
    await form.waitClosed();
  });

  test('nombre solo con espacios → Guardar sigue deshabilitado → Cancelar → nada cambia', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('     ');

    await expect(form.save).toBeDisabled();
    await form.cancel.click();
    await form.waitClosed();
    expect(await catalog.recipeNamesIn('Queques')).toEqual([...RECIPES.Queques]);
  });

  test('nombre sin ingredientes → Guardar → error de la grilla → añadir insumo → guardar → aparece listada', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Sin ingredientes al principio E2E');
    await form.save.click();
    await expect(grid.error).toHaveText('Agrega al menos un ingrediente.');
    await expect(form.root).toBeVisible();

    await grid.fillExistingLine(0, SUPPLIES.harina.name, '200');
    await form.save.click();

    await form.waitClosed();
    expect(await catalog.recipeNamesIn('Queques')).toContain('Sin ingredientes al principio E2E');
  });

  test('borrar el nombre de una receta existente → Guardar no hace nada → Cancelar → conserva el nombre', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();

    await catalog.recipe('Rellenos', 'Fresas con Crema').click();
    await form.waitReady();
    await form.name.fill('');

    await expect(form.save).toBeDisabled();
    await form.cancel.click();
    await form.waitClosed();
    expect(await catalog.recipeNamesIn('Rellenos')).toEqual([...RECIPES.Rellenos]);
  });
});
