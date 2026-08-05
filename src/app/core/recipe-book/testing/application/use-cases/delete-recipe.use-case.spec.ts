import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../../_common/entity-id';
import { EventBus } from '../../../../_common/eventbus/event-bus';
import { Quantity } from '../../../../_common/quantity';
import { DeleteRecipe } from '../../../application/use-cases/delete-recipe.use-case';
import { RecipeRepository } from '../../../domain/repositories/recipe.repository';
import { RecipeIngredient } from '../../../domain/value-objects/recipe-ingredient';
import { makeRecipe, makeRecipeBookFakes, RecordingEventBus } from '../../recipe-book-test-doubles';

describe('DeleteRecipe', () => {
  let deleteRecipe: DeleteRecipe;
  let recipes: RecipeRepository;

  const conHarina = [RecipeIngredient.of(new EntityId('ing-harina'), Quantity.of(500, 'g'))];

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
    deleteRecipe = TestBed.inject(DeleteRecipe);
    recipes = TestBed.inject(RecipeRepository);

    await recipes.save(makeRecipe('rec-1', 'cat-1', 'Bizcocho', conHarina));
    await recipes.save(makeRecipe('rec-2', 'cat-1', 'Torta', conHarina));
  });

  it('la receta deja de estar, y las demás siguen', async () => {
    await deleteRecipe.execute({ id: 'rec-1' });

    expect(await recipes.byId(new EntityId('rec-1'))).toBeNull();
    expect((await recipes.all()).map((recipe) => recipe.name)).toEqual(['Torta']);
  });

  it('no publica ningún evento: el borrado se sube porque la sincronización lo deduce', async () => {
    // No hay `RecipeDeleted` en el Published Language y no hace falta: la lápida sale de comparar lo que
    // hay aquí con la base de la última vez. Ver `DeleteRecipe`.
    await deleteRecipe.execute({ id: 'rec-1' });

    expect((TestBed.inject(EventBus) as RecordingEventBus).published).toEqual([]);
  });

  it('borrar dos veces no es un error: la segunda no encuentra nada que borrar', async () => {
    // Importa porque el borrado también llega de fuera (la hoja del usuario), y esa entrega es
    // at-least-once: el mismo borrado puede aplicarse dos veces.
    await deleteRecipe.execute({ id: 'rec-1' });

    await expect(deleteRecipe.execute({ id: 'rec-1' })).resolves.toBeUndefined();
  });
});
