import { test, expect } from '../../../fixtures/app-fixture';
import { RECIPES, SUPPLIES } from '../../../support/seed';

/**
 * Flujo completo de **editar receta**: el formulario es el mismo que el de crear,
 * precargado con nombre, líneas y características. Cada test acaba con el cambio
 * proyectado de vuelta en la lista (o comprobado al reabrir el formulario).
 */
test.describe('Formulario de receta · editar', () => {
  test('receta existente → renombrar → guardar → la lista muestra el nombre nuevo', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();

    await catalog.recipe('Queques', 'Keke de Limón').click();
    await form.waitReady();
    await form.name.fill('Keke de Limón renombrado E2E');
    await form.save.click();
    await form.waitClosed();

    const names = await catalog.recipeNamesIn('Queques');
    expect(names).toContain('Keke de Limón renombrado E2E');
    expect(names).not.toContain('Keke de Limón');
    expect(names).toHaveLength(RECIPES.Queques.length);
  });

  test('receta existente → editar la cantidad de una línea → guardar → se conserva al reabrir', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    await catalog.recipe('Rellenos', 'Manjar Blanco').click();
    await form.waitReady();
    await grid.quantityInput(0).fill('777');
    await form.save.click();
    await form.waitClosed();

    await catalog.recipe('Rellenos', 'Manjar Blanco').click();
    await form.waitReady();
    await expect(grid.quantityInput(0)).toHaveValue('777');
  });

  test('receta existente → añadir una línea nueva → guardar → la receta queda con una línea más', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    await catalog.recipe('Rellenos', 'Manjar Blanco').click();
    await form.waitReady();
    const filledRows = 1; // el seed de esta receta trae una sola línea
    await grid.fillExistingLine(filledRows, SUPPLIES.huevos.name, '4');
    await form.save.click();
    await form.waitClosed();

    await catalog.recipe('Rellenos', 'Manjar Blanco').click();
    await form.waitReady();
    await expect(grid.nameInput(1)).toHaveValue(SUPPLIES.huevos.name);
    await expect(grid.quantityInput(1)).toHaveValue('4');
  });

  test('receta existente → quitar una línea → guardar → la línea ya no está al reabrir', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    await catalog.recipe('Coberturas', 'Ganache de Chocolate').click();
    await form.waitReady();
    const firstName = await grid.nameInput(0).inputValue();
    const secondName = await grid.nameInput(1).inputValue();
    expect(firstName).not.toEqual(secondName);

    await grid.removeRowButton(0).click();
    await expect(grid.nameInput(0)).toHaveValue(secondName);
    await form.save.click();
    await form.waitClosed();

    await catalog.recipe('Coberturas', 'Ganache de Chocolate').click();
    await form.waitReady();
    await expect(grid.nameInput(0)).toHaveValue(secondName);
    expect(await grid.nameInput(1).inputValue()).toEqual('');
  });

  test('receta con características → quitar el sabor → guardar → su badge desaparece', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();

    // Primero se le pone un sabor (el seed no trae ninguno).
    await catalog.recipe('Queques', 'Vainilla Clásica').click();
    await form.waitReady();
    await form.flavor.pick('Sabor', 'Vainilla');
    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Vainilla Clásica')).toContainText('Sabor: Vainilla');

    // Y luego se le quita.
    await catalog.recipe('Queques', 'Vainilla Clásica').click();
    await form.waitReady();
    await form.flavor.removeChip('Sabor', 'Vainilla').click();
    await expect(form.flavor.chip('Sabor', 'Vainilla')).toHaveCount(0);
    await form.save.click();
    await form.waitClosed();

    await expect(catalog.recipe('Queques', 'Vainilla Clásica').locator('migo-badge')).toHaveCount(0);
  });

  test('editar receta → cambiar de categoría no se ofrece (la categoría es fija)', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();

    await catalog.recipe('Coberturas', 'Fudge de Chocolate').click();
    await form.waitReady();

    await expect(form.subtitle).toHaveText('Coberturas');
    // No hay control de categoría: solo Nombre, Sabor y Tamaño.
    await expect(form.root.locator('label')).toHaveText([
      'Nombre',
      'Sabor (opcional)',
      'Tamaño (opcional)',
    ]);

    await form.cancel.click();
    await form.waitClosed();
  });
});
