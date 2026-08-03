import { test, expect } from '../../../fixtures/app-fixture';
import { RECIPES, SUPPLIES } from '../../../support/seed';

/**
 * Edición de recetas: el formulario es el mismo que el de crear, precargado con nombre, líneas
 * y características. Dos journeys, un arranque cada uno — uno sobre el nombre y las líneas,
 * otro sobre las características y la categoría fija.
 *
 * Cada cambio se cierra releyéndolo (lista o formulario reabierto), nunca en el estado
 * intermedio de «se escribió en el campo».
 */
test.describe('Formulario de receta · editar', () => {
  test('renombrar una receta → guardar → la lista muestra el nombre nuevo → editar cantidades, añadir y quitar líneas → guardar → todo persiste al reabrir', async ({
    openCatalog,
    catalog,
    form,
    grid,
  }) => {
    await openCatalog();

    // Renombrar: la lista cambia, pero no gana ni pierde recetas.
    await catalog.recipe('Queques', 'Keke de Limón').click();
    await form.waitReady();
    await form.name.fill('Keke de Limón renombrado E2E');
    await form.save.click();
    await form.waitClosed();

    const names = await catalog.recipeNamesIn('Queques');
    expect(names).toContain('Keke de Limón renombrado E2E');
    expect(names).not.toContain('Keke de Limón');
    expect(names).toHaveLength(RECIPES.Queques.length);

    // Cambiar una cantidad y añadir una línea nueva (el seed trae una sola).
    await catalog.recipe('Rellenos', 'Manjar Blanco').click();
    await form.waitReady();
    await grid.quantityInput(0).fill('777');
    await grid.fillExistingLine(1, SUPPLIES.huevos.name, '4');
    await form.save.click();
    await form.waitClosed();

    await catalog.recipe('Rellenos', 'Manjar Blanco').click();
    await form.waitReady();
    await expect(grid.quantityInput(0)).toHaveValue('777');
    await expect(grid.nameInput(1)).toHaveValue(SUPPLIES.huevos.name);
    await expect(grid.quantityInput(1)).toHaveValue('4');
    await form.cancel.click();
    await form.waitClosed();

    // Quitar una línea: las de abajo suben y la receta se guarda con una menos.
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

  test('la categoría es fija y no se ofrece cambiarla → añadir un sabor → guardar → su badge aparece → quitarlo → guardar → la fila se queda sin badges', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();

    // El formulario solo tiene Nombre y Características: no hay control de categoría.
    await catalog.recipe('Coberturas', 'Fudge de Chocolate').click();
    await form.waitReady();
    await expect(form.subtitle).toHaveText('Coberturas');
    await expect(form.fieldLabels).toHaveText(['Nombre', 'Características (opcional)']);
    await form.cancel.click();
    await form.waitClosed();

    // El seed no trae sabor: primero se pone…
    await catalog.recipe('Queques', 'Vainilla Clásica').click();
    await form.waitReady();
    await form.properties.pick('Sabor', 'Vainilla');
    await form.save.click();
    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Vainilla Clásica')).toContainText('Sabor: Vainilla');

    // …y luego se quita, que es el caso que de verdad puede romperse.
    await catalog.recipe('Queques', 'Vainilla Clásica').click();
    await form.waitReady();
    await form.properties.removeChip('Sabor', 'Vainilla').click();
    await expect(form.properties.chip('Sabor', 'Vainilla')).toHaveCount(0);
    await form.save.click();
    await form.waitClosed();

    await expect(catalog.recipeBadges('Queques', 'Vainilla Clásica')).toHaveCount(0);
  });

  test('característica que no existe → «Añadir» pregunta a qué grupo → un molde nuevo pide su factor de escalado → guardar → los badges aparecen → otra receta ya ofrece las etiquetas nuevas del catálogo', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();

    /*
     * Los tres tipos son `allowCreate`, así que teclear un valor que no está ofrece «Añadir
     * «X»…» y pregunta a qué grupo va. Un sabor se crea con eso solo; un molde declara además
     * `extraField`, así que pide el **factor de escalado** antes de confirmar. Cada creación
     * dispara `SaveProperty`, que lo persiste en el catálogo — eso es lo que cierra el flujo.
     */
    await catalog.recipe('Queques', 'Torta Húmeda de Chocolate').click();
    await form.waitReady();

    await form.properties.create('Maracuyá E2E', { group: 'Sabor' });
    await expect(form.properties.chip('Sabor', 'Maracuyá E2E')).toBeVisible();

    await form.properties.create('Molde jumbo E2E', { group: 'Molde', factor: '3' });
    await expect(form.properties.chip('Molde', 'Molde jumbo E2E')).toBeVisible();

    // Unas porciones nuevas NO preguntan el factor: el número tecleado ya lo es (por eso no se le
    // pasa `factor` y el chip tiene que salir igual).
    await form.properties.create('33', { group: 'Porciones' });
    await expect(form.properties.chip('Porciones', '33')).toBeVisible();

    await form.save.click();
    await form.waitClosed();

    const torta = catalog.recipe('Queques', 'Torta Húmeda de Chocolate');
    await expect(catalog.recipeBadges('Queques', 'Torta Húmeda de Chocolate')).toHaveCount(3);
    await expect(torta).toContainText('Sabor: Maracuyá E2E');
    await expect(torta).toContainText('Molde: Molde jumbo E2E');
    await expect(torta).toContainText('Porciones: 33');

    /*
     * Estado terminal: las etiquetas nuevas no se quedaron en esa receta, están en el catálogo.
     * Otra receta cualquiera ya las ofrece como valores existentes del desplegable — que es lo
     * único que demuestra que `SaveProperty` persistió y no solo pintó un chip.
     */
    await catalog.recipe('Queques', 'Bizcocho de Vainilla').click();
    await form.waitReady();
    await form.properties.open();
    await expect(form.properties.option('Sabor', 'Maracuyá E2E')).toBeVisible();
    await expect(form.properties.option('Molde', 'Molde jumbo E2E')).toBeVisible();
    await expect(form.properties.option('Porciones', '33')).toBeVisible();

    await form.properties.option('Sabor', 'Maracuyá E2E').click();
    await expect(form.properties.chip('Sabor', 'Maracuyá E2E')).toBeVisible();
    await form.save.click();
    await form.waitClosed();

    await expect(catalog.recipe('Queques', 'Bizcocho de Vainilla')).toContainText(
      'Sabor: Maracuyá E2E',
    );
  });
});
