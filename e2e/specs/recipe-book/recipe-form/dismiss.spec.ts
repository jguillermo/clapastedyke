import { test, expect } from '../../../fixtures/app-fixture';
import { RECIPES, SUPPLIES } from '../../../support/seed';

/**
 * Todas las salidas del formulario **sin guardar**, recorridas en un único journey: `Cancelar`,
 * la × de la cabecera, un nombre borrado que deshabilita `Guardar` y Escape (que lo gestiona el
 * CDK Dialog). El invariante es siempre el mismo — el catálogo queda exactamente como estaba.
 *
 * Se encadenan en la misma sesión porque ninguna de estas salidas escribe nada: el estado de
 * partida del caso siguiente es el mismo seed intacto que verifica el caso anterior.
 */
test.describe('Formulario de receta · descartar', () => {
  test('crear a medias → Cancelar → × → renombrar y Cancelar → borrar el nombre deshabilita Guardar → Escape → vuelve la cocina → reabrir el libro → nada se guardó', async ({
    openCatalog,
    catalog,
    form,
    grid,
    home,
    page,
  }) => {
    await openCatalog();

    // Cancelar con datos a medias.
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Descartada por Cancelar E2E');
    await grid.fillExistingLine(0, SUPPLIES.harina.name, '100');
    await form.cancel.click();
    await form.waitClosed();
    expect(await catalog.recipeNamesIn('Queques')).toEqual([...RECIPES.Queques]);

    // La × de la cabecera hace lo mismo, y el libro queda operable después.
    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Descartada por la X E2E');
    await grid.fillExistingLine(0, SUPPLIES.huevos.name, '2');
    await form.close.click();
    await form.waitClosed();
    expect(await catalog.recipeNamesIn('Rellenos')).toEqual([...RECIPES.Rellenos]);
    await expect(catalog.suppliesButton).toBeEnabled();

    // Renombrar una receta existente y cancelar no toca su nombre.
    await catalog.recipe('Queques', 'Bizcocho de Naranja').click();
    await form.waitReady();
    await expect(form.title).toHaveText('Bizcocho de Naranja');
    await form.name.fill('Nombre que no debe guardarse E2E');
    await form.cancel.click();
    await form.waitClosed();
    expect(await catalog.recipeNamesIn('Queques')).toEqual([...RECIPES.Queques]);

    // Vaciar el nombre de una receta existente deshabilita `Guardar`.
    await catalog.recipe('Rellenos', 'Fresas con Crema').click();
    await form.waitReady();
    await form.name.fill('');
    await expect(form.save).toBeDisabled();
    await form.cancel.click();
    await form.waitClosed();
    expect(await catalog.recipeNamesIn('Rellenos')).toEqual([...RECIPES.Rellenos]);

    /*
     * OJO — comportamiento actual: Escape cierra el formulario **y además el libro**,
     * devolviendo al usuario a la cocina. El atajo del libro (`document:keydown`) se ejecuta en
     * el mismo evento en el que el CDK ya ha cerrado el diálogo, así que su guarda `dialogOpen`
     * ya vale `false` y también actúa. Se recorre el flujo real hasta el terminal que importa.
     */
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
});
