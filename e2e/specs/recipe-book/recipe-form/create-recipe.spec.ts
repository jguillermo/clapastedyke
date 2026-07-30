import { test, expect } from '../../../fixtures/app-fixture';
import { RECIPES, SUPPLIES } from '../../../support/seed';

/**
 * Flujo completo de **crear receta** (`features/recipe-book/recipe-form`): nombre +
 * ingredientes del catálogo → Guardar → la receta aparece en su categoría. El estado
 * terminal es siempre la receta listada (dato persistido y proyectado de vuelta).
 */
test.describe('Formulario de receta · crear', () => {
  test('nueva receta con un insumo del catálogo → guardar → aparece en su categoría', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Bizcocho E2E');
    await grid.fillExistingLine(0, SUPPLIES.harina.name, '500');
    await form.save.click();

    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Bizcocho E2E')).toBeVisible();
    expect(await catalog.recipeNamesIn('Queques')).toContain('Bizcocho E2E');
  });

  test('nueva receta con varios insumos → guardar → aparece y conserva sus líneas al reabrir', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Rellenos').click();
    await form.waitReady();
    await form.name.fill('Relleno de tres insumos E2E');
    await grid.fillExistingLine(0, SUPPLIES.harina.name, '250');
    await grid.fillExistingLine(1, SUPPLIES.huevos.name, '3');
    await grid.fillExistingLine(2, SUPPLIES.azucarImpalpable.name, '100');
    await form.save.click();
    await form.waitClosed();

    await catalog.recipe('Rellenos', 'Relleno de tres insumos E2E').click();
    await form.waitReady();
    await expect(grid.nameInput(0)).toHaveValue(SUPPLIES.harina.name);
    await expect(grid.quantityInput(0)).toHaveValue('250');
    await expect(grid.nameInput(1)).toHaveValue(SUPPLIES.huevos.name);
    await expect(grid.quantityInput(1)).toHaveValue('3');
    await expect(grid.nameInput(2)).toHaveValue(SUPPLIES.azucarImpalpable.name);
    await expect(grid.quantityInput(2)).toHaveValue('100');
  });

  test('nueva receta con sabor y tamaño → guardar → se listan sus características', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Coberturas').click();
    await form.waitReady();
    await form.name.fill('Cobertura completa E2E');
    await form.properties.pick('Sabor', 'Fresa');
    await form.properties.pick('Porciones', '40');
    await form.properties.pick('Molde', 'Molde pequeño');
    await grid.fillExistingLine(0, SUPPLIES.huevos.name, '2');
    await form.save.click();
    await form.waitClosed();

    const row = catalog.recipe('Coberturas', 'Cobertura completa E2E');
    await expect(row).toContainText('Sabor: Fresa');
    await expect(row).toContainText('Porciones: 40');
    await expect(row).toContainText('Molde: Molde pequeño');
  });

  test('dos recetas nuevas seguidas → guardar cada una → ambas quedan listadas', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    for (const name of ['Primera E2E', 'Segunda E2E']) {
      await catalog.newRecipeIn('Queques').click();
      await form.waitReady();
      await form.name.fill(name);
      await grid.fillExistingLine(0, SUPPLIES.harina.name, '100');
      await form.save.click();
      await form.waitClosed();
    }

    const names = await catalog.recipeNamesIn('Queques');
    expect(names).toContain('Primera E2E');
    expect(names).toContain('Segunda E2E');
    expect(names).toHaveLength(RECIPES.Queques.length + 2);
  });

  test('nombre con espacios sobrantes → guardar → se lista recortado', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('   Recorte E2E   ');
    await grid.fillExistingLine(0, SUPPLIES.harina.name, '100');
    await form.save.click();
    await form.waitClosed();

    expect(await catalog.recipeNamesIn('Queques')).toContain('Recorte E2E');
  });
});
