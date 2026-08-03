import { test, expect } from '../../../fixtures/app-fixture';
import { CATEGORIES, GLASEADO, RECIPES } from '../../../support/seed';

/**
 * Ruta accesible del libro (`app-recipe-book-3d` sin WebGL): la lista DOM con una sección por
 * categoría, sus recetas, el `Nuevo` de cada una y el botón de Insumos.
 *
 * Dos journeys, un arranque cada uno: el catálogo con todos sus puntos de entrada al
 * formulario, y el ciclo de las características hasta verlas pintadas como badges en la lista.
 */
test.describe('Libro de recetas · lista accesible', () => {
  test('libro → proyecta el catálogo sembrado → Nuevo en cada categoría, receta existente y homónimas abren su formulario → Cancelar → el catálogo queda intacto', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();

    // El catálogo sembrado, completo y ordenado.
    await expect(catalog.categoryHeadings).toHaveCount(CATEGORIES.length);
    await expect(catalog.categoryHeadings).toHaveText([...CATEGORIES]);
    for (const category of CATEGORIES) {
      expect(await catalog.recipeNamesIn(category)).toEqual([...RECIPES[category]]);
    }
    await expect(catalog.suppliesButton).toBeEnabled();
    await expect(catalog.back).toBeEnabled();

    // `Nuevo` de cada categoría → formulario en blanco con esa categoría fija.
    for (const category of CATEGORIES) {
      await catalog.newRecipeIn(category).click();
      await form.waitReady();
      await expect(form.title).toHaveText('Nueva receta');
      await expect(form.subtitle).toHaveText(category);
      await expect(form.name).toHaveValue('');
      await expect(form.dialogNamed('Nueva receta')).toBeVisible();
      await form.cancel.click();
      await form.waitClosed();
      await expect(catalog.newRecipeIn(category)).toBeVisible();
    }

    // Una receta de la lista → formulario de edición precargado.
    await catalog.recipe(GLASEADO.category, GLASEADO.name).click();
    await form.waitReady();
    await expect(form.title).toHaveText(GLASEADO.name);
    await expect(form.subtitle).toHaveText(GLASEADO.category);
    await expect(form.name).toHaveValue(GLASEADO.name);
    await form.cancel.click();
    await form.waitClosed();

    // Dos recetas homónimas en categorías distintas: cada fila abre la suya.
    const shared = 'Crema Chantilly';
    expect(RECIPES.Rellenos).toContain(shared);
    expect(RECIPES.Coberturas).toContain(shared);
    for (const category of ['Rellenos', 'Coberturas'] as const) {
      await catalog.recipe(category, shared).click();
      await form.waitReady();
      await expect(form.subtitle).toHaveText(category);
      await form.cancel.click();
      await form.waitClosed();
    }

    // Estado terminal: solo se abrió y cerró; el catálogo no ganó ni perdió nada.
    for (const category of CATEGORIES) {
      expect(await catalog.recipeNamesIn(category)).toEqual([...RECIPES[category]]);
    }
  });

  test('receta sin características → editarla y darle sabor y tamaño → guardar → su fila pinta los badges; otra con solo sabor → un único badge', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();

    // El seed no trae características: la fila arranca sin badges.
    await expect(catalog.recipe('Queques', 'Keke de Chocolate')).toBeVisible();
    await expect(catalog.recipeBadges('Queques', 'Keke de Chocolate')).toHaveCount(0);

    await catalog.recipe('Queques', 'Keke de Chocolate').click();
    await form.waitReady();
    await form.properties.pick('Sabor', 'Chocolate');
    await form.properties.pick('Porciones', '24');
    await form.properties.pick('Molde', 'Molde grande');
    await form.save.click();
    await form.waitClosed();

    const keke = catalog.recipe('Queques', 'Keke de Chocolate');
    await expect(catalog.recipeBadges('Queques', 'Keke de Chocolate')).toHaveCount(3);
    await expect(keke).toContainText('Sabor: Chocolate');
    await expect(keke).toContainText('Porciones: 24');
    await expect(keke).toContainText('Molde: Molde grande');

    // Solo una característica → un solo badge (no se pintan huecos).
    await catalog.recipe('Rellenos', 'Crema Pastelera').click();
    await form.waitReady();
    await form.properties.pick('Sabor', 'Vainilla');
    await form.save.click();
    await form.waitClosed();

    const pastelera = catalog.recipe('Rellenos', 'Crema Pastelera');
    await expect(catalog.recipeBadges('Rellenos', 'Crema Pastelera')).toHaveCount(1);
    await expect(pastelera).toContainText('Sabor: Vainilla');
  });
});
