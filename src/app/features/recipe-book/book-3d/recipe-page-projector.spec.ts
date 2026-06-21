import { EntityId } from '@core/_common/entity-id';
import { Quantity } from '@core/_common/quantity';
import type { RecipeBookCatalog } from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import { SpongeRecipe } from '@core/recipe-book/domain/entities/sponge-recipe';
import { FillingRecipe } from '@core/recipe-book/domain/entities/filling-recipe';
import { IngredientLine } from '@core/recipe-book/domain/value-objects/ingredient-line';
import { RecipeYield } from '@core/recipe-book/domain/value-objects/recipe-yield';
import { makeIngredient } from '@core/recipe-book/testing/recipe-book-test-doubles';
import { toPages } from './recipe-page-projector';

function emptyCatalog(): RecipeBookCatalog {
  return { ingredients: [], sponges: [], fillings: [], coverings: [], packagingRules: [] };
}

describe('recipe-page-projector', () => {
  it('empty catalog → cover + "vacío" page', () => {
    const pages = toPages(emptyCatalog());

    expect(pages[0].kind).toBe('cover');
    expect(pages).toHaveLength(2);
    expect(pages[1].kind).toBe('recipe');
    expect(pages[1].title).toContain('vací');
  });

  it('projects a sponge with its ingredient lines into a recipe page', () => {
    const harina = makeIngredient('IN-1', 'Harina');
    const sponge = SpongeRecipe.create(
      new EntityId('SP-1'),
      'Vainilla clásica',
      RecipeYield.of(Quantity.of(2500, 'g'), 6, 'mediano'),
      [IngredientLine.of(new EntityId('IN-1'), Quantity.of(500, 'g'))],
      'Vainilla',
    );
    const catalog: RecipeBookCatalog = { ...emptyCatalog(), ingredients: [harina], sponges: [sponge] };

    const pages = toPages(catalog);

    // cover, sección Queques, receta del queque, sección Insumos, página del insumo
    expect(pages.map((p) => p.kind)).toEqual(['cover', 'section', 'recipe', 'section', 'recipe']);
    expect(pages[1].title).toBe('Queques');
    const recipe = pages[2];
    expect(recipe.title).toBe('Vainilla clásica');
    expect(recipe.subtitle).toBe('Vainilla');
    expect(recipe.chips).toContain('2.5 kg');
    expect(recipe.columns).toEqual(['Insumo', 'Cantidad']);
    expect(recipe.rows).toEqual([{ cells: ['Harina', '500 g'] }]);
    expect(recipe.footer).toBe('1 insumos');
  });

  it('orders sections: queques → rellenos → coberturas → insumos', () => {
    const harina = makeIngredient('IN-1', 'Harina');
    const filling = FillingRecipe.create(
      new EntityId('FL-1'),
      'Manjar',
      Quantity.of(1000, 'g'),
      [IngredientLine.of(new EntityId('IN-1'), Quantity.of(300, 'g'))],
    );
    const catalog: RecipeBookCatalog = { ...emptyCatalog(), ingredients: [harina], fillings: [filling] };

    const pages = toPages(catalog);

    // cover, sección Rellenos, receta Manjar, sección Insumos, insumo Harina
    expect(pages.map((p) => p.kind)).toEqual(['cover', 'section', 'recipe', 'section', 'recipe']);
    expect(pages[1].title).toBe('Rellenos');
    expect(pages[2].title).toBe('Manjar');
    expect(pages[3].title).toBe('Insumos');
    expect(pages[4].title).toBe('Harina');
  });
});
