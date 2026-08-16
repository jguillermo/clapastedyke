import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { DeleteSupply } from '../../../application/use-cases/delete-supply.use-case';
import { RecipeIngredient } from '../../../domain/value-objects/recipe-ingredient';
import { RecipeRepository } from '../../../domain/repositories/recipe.repository';
import { SupplyRepository } from '../../../domain/repositories/supply.repository';
import { makeRecipe, makeRecipeBookFakes, makeSupply } from '../../recipe-book-test-doubles';

/**
 * Borrar un insumo.
 *
 * Lo que este spec protege no es el borrado —eso es una línea— sino **la negativa**: un insumo que una
 * receta usa no se puede borrar sin decidir por el usuario qué pasa con esa receta.
 */
describe('DeleteSupply', () => {
  let deleteSupply: DeleteSupply;
  let supplies: SupplyRepository;
  let recipes: RecipeRepository;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
    deleteSupply = TestBed.inject(DeleteSupply);
    supplies = TestBed.inject(SupplyRepository);
    recipes = TestBed.inject(RecipeRepository);

    await supplies.save(makeSupply('ing-harina', 'Harina'));
    await supplies.save(makeSupply('ing-sal', 'Sal'));
  });

  it('un insumo que no usa nadie se borra y deja de listarse', async () => {
    await deleteSupply.execute({ id: 'ing-sal' });

    expect(await supplies.byId(new EntityId('ing-sal'))).toBeNull();
    expect((await supplies.all()).map((supply) => supply.name)).toEqual(['Harina']);
  });

  it('un insumo que usa una receta NO se borra, y el motivo dice cuál', async () => {
    // Borrarlo dejaría la receta sin ese ingrediente y con un costo más bajo que nadie pidió cambiar.
    await recipes.save(
      makeRecipe('rec-1', 'cat-1', 'Bizcocho', [
        RecipeIngredient.of(new EntityId('ing-harina'), Quantity.of(500, 'g')),
      ]),
    );

    await expect(deleteSupply.execute({ id: 'ing-harina' })).rejects.toThrow(
      'No se puede borrar: lo usa la receta «Bizcocho».',
    );
    expect(await supplies.byId(new EntityId('ing-harina'))).not.toBeNull();
  });

  it('con varias recetas usándolo, el motivo las cuenta y nombra unas cuantas', async () => {
    // «Lo usa alguna receta» obligaría a buscarlas una por una; el mensaje tiene que ser accionable.
    for (const [id, name] of [
      ['rec-1', 'Bizcocho'],
      ['rec-2', 'Torta'],
    ]) {
      await recipes.save(
        makeRecipe(id, 'cat-1', name, [
          RecipeIngredient.of(new EntityId('ing-harina'), Quantity.of(100, 'g')),
        ]),
      );
    }

    await expect(deleteSupply.execute({ id: 'ing-harina' })).rejects.toThrow(
      'No se puede borrar: lo usa 2 recetas («Bizcocho», «Torta»).',
    );
  });
});
