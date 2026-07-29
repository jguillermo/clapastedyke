import { test, expect } from '../../../fixtures/app-fixture';

/**
 * Cada receta de la lista accesible muestra sus características como badges (Sabor,
 * Porciones, Molde). El seed no trae ninguna, así que se comprueba el ciclo completo:
 * sin badges → se guardan características → la receta las muestra en la lista.
 */
test.describe('Libro de recetas · badges de la lista', () => {
  test('receta sembrada sin características → su fila no pinta badges', async ({
    openCatalog,
    catalog,
  }) => {
    await openCatalog();

    await expect(catalog.recipe('Queques', 'Keke de Chocolate')).toBeVisible();
    await expect(catalog.recipeBadges('Queques', 'Keke de Chocolate')).toHaveCount(0);
  });

  test('editar receta → añadir sabor y tamaño → guardar → su fila muestra los tres badges', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();
    const row = catalog.recipe('Queques', 'Keke de Chocolate');

    await row.click();
    await form.waitReady();
    await form.flavor.pick('Sabor', 'Chocolate');
    await form.size.pick('Porciones', '24');
    await form.size.pick('Molde', 'Molde grande');
    await form.save.click();
    await form.waitClosed();

    const updated = catalog.recipe('Queques', 'Keke de Chocolate');
    await expect(catalog.recipeBadges('Queques', 'Keke de Chocolate')).toHaveCount(3);
    await expect(updated).toContainText('Sabor: Chocolate');
    await expect(updated).toContainText('Porciones: 24');
    await expect(updated).toContainText('Molde: Molde grande');
  });

  test('editar receta → añadir solo sabor → guardar → su fila muestra un único badge', async ({
    openCatalog,
    catalog,
    form,
  }) => {
    await openCatalog();

    await catalog.recipe('Rellenos', 'Crema Pastelera').click();
    await form.waitReady();
    await form.flavor.pick('Sabor', 'Vainilla');
    await form.save.click();
    await form.waitClosed();

    const updated = catalog.recipe('Rellenos', 'Crema Pastelera');
    await expect(catalog.recipeBadges('Rellenos', 'Crema Pastelera')).toHaveCount(1);
    await expect(updated).toContainText('Sabor: Vainilla');
  });
});
