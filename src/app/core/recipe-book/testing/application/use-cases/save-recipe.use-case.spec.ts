import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../../_common/entity-id';
import { makeRecipeBookFakes, makeSupply } from '../../recipe-book-test-doubles';
import { SaveRecipe } from '../../../application/use-cases/save-recipe.use-case';
import { RecipeRepository } from '../../../domain/repositories/recipe.repository';
import { SupplyRepository } from '../../../domain/repositories/supply.repository';
import { RecordingEventBus } from '../../recipe-book-test-doubles';
import { EventBus } from '../../../../_common/event-bus';

describe('SaveRecipe', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
  });

  /** Seeds one supply and returns its id (recipes reference existing supplies). */
  async function seedSupply(id = 'ing-harina'): Promise<string> {
    await TestBed.inject(SupplyRepository).save(makeSupply(id, 'Harina'));
    return id;
  }

  it('creates a recipe (no id) and publishes RecipeSaved', async () => {
    const supplyId = await seedSupply();
    const { id } = await TestBed.inject(SaveRecipe).execute({
      categoryId: 'cat-q',
      name: 'Vainilla',
      lines: [{ supplyId, quantity: 500 }],
    });

    const saved = await TestBed.inject(RecipeRepository).byId(new EntityId(id));
    expect(saved?.name).toBe('Vainilla');
    expect(saved?.lines).toHaveLength(1);

    const bus = TestBed.inject(EventBus) as RecordingEventBus;
    expect(bus.names()).toContain('RecipeSaved');
  });

  it('editing = saving again with the same id replaces in place (upsert, no duplicate)', async () => {
    const supplyId = await seedSupply();
    const save = TestBed.inject(SaveRecipe);
    const { id } = await save.execute({ categoryId: 'cat-q', name: 'Vainilla', lines: [{ supplyId, quantity: 500 }] });

    await save.execute({ id, categoryId: 'cat-q', name: 'Vainilla clásica', lines: [{ supplyId, quantity: 600 }] });

    const recipes = await TestBed.inject(RecipeRepository).all();
    expect(recipes).toHaveLength(1);
    expect(recipes[0].name).toBe('Vainilla clásica');
  });

  it('rejects a recipe without lines (domain rule)', async () => {
    await expect(
      TestBed.inject(SaveRecipe).execute({ categoryId: 'cat-q', name: 'Vacía', lines: [] }),
    ).rejects.toThrow();
  });

  it('throws when a line references a missing supply', async () => {
    await expect(
      TestBed.inject(SaveRecipe).execute({
        categoryId: 'cat-q',
        name: 'Fantasma',
        lines: [{ supplyId: 'ing-inexistente', quantity: 100 }],
      }),
    ).rejects.toThrow();
  });
});
