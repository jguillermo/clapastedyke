import { test, expect } from '../../../fixtures/app-fixture';
import { RECIPES, SUPPLIES } from '../../../support/seed';

/**
 * Alta de recetas en `features/recipe-book/recipe-form`, en **journeys completos**: cada test
 * arranca la app una vez y encadena validación, corrección y guardado hasta el estado terminal
 * (la receta listada en su categoría, o sus datos releídos al reabrir el formulario).
 *
 * Ningún caso termina en «apareció el error»: siempre se corrige el motivo y se llega a guardar.
 */
test.describe('Formulario de receta · crear', () => {
  test('Nuevo en Queques → Guardar deshabilitado → nombre en blanco sigue deshabilitado → nombre válido → Guardar sin insumos avisa → añadir insumo → guardar → segunda receta → ambas listadas y recortadas', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();

    // El botón depende del nombre: en blanco y con solo espacios sigue deshabilitado.
    await expect(form.save).toBeDisabled();
    await form.name.fill('     ');
    await expect(form.save).toBeDisabled();

    await form.name.fill('Sin ingredientes al principio E2E');
    await expect(form.save).toBeEnabled();

    // Los ingredientes los valida la grilla al enviar, no el botón.
    await form.save.click();
    await expect(grid.error).toHaveText('Agrega al menos un ingrediente.');
    await expect(form.root).toBeVisible();

    await grid.fillExistingLine(0, SUPPLIES.harina.name, '200');
    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Sin ingredientes al principio E2E')).toBeVisible();

    // Segunda receta seguida: el nombre se guarda recortado de espacios.
    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('   Recorte E2E   ');
    await grid.fillExistingLine(0, SUPPLIES.harina.name, '100');
    await form.save.click();
    await form.waitClosed();

    const names = await catalog.recipeNamesIn('Queques');
    expect(names).toContain('Sin ingredientes al principio E2E');
    expect(names).toContain('Recorte E2E');
    expect(names).toHaveLength(RECIPES.Queques.length + 2);
  });

  test('Nuevo en Rellenos → tres insumos → guardar → reabrir conserva sus líneas → Nuevo en Coberturas → sabor, porciones y molde → guardar → se listan sus características', async ({
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

    // Estado terminal: el dato persistido y proyectado de vuelta al reabrir.
    await catalog.recipe('Rellenos', 'Relleno de tres insumos E2E').click();
    await form.waitReady();
    await expect(grid.nameInput(0)).toHaveValue(SUPPLIES.harina.name);
    await expect(grid.quantityInput(0)).toHaveValue('250');
    await expect(grid.nameInput(1)).toHaveValue(SUPPLIES.huevos.name);
    await expect(grid.quantityInput(1)).toHaveValue('3');
    await expect(grid.nameInput(2)).toHaveValue(SUPPLIES.azucarImpalpable.name);
    await expect(grid.quantityInput(2)).toHaveValue('100');
    await form.cancel.click();
    await form.waitClosed();

    // Y una receta con las tres características, que la lista pinta como badges.
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
});
