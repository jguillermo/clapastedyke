import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../../_common/entity-id';
import { EventBus } from '../../../../_common/event-bus';
import {
  aPurchase,
  makeRecipeBookFakes,
  makeWeightCategory,
  RecordingEventBus,
} from '../../recipe-book-test-doubles';
import { RecipeCategoryRepository } from '../../../domain/repositories/recipe-category.repository';
import { RecipeRepository } from '../../../domain/repositories/recipe.repository';
import { SaveIngredient } from '../../../application/use-cases/save-ingredient.use-case';
import { SaveRecipe } from '../../../application/use-cases/save-recipe.use-case';

const CAT = 'cat-q';
const PESO = `${CAT}-peso`;

describe('SaveRecipe', () => {
  let bus: RecordingEventBus;
  let flour: string;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
    bus = TestBed.inject(EventBus) as RecordingEventBus;
    await TestBed.inject(RecipeCategoryRepository).save(makeWeightCategory(CAT, 'Queques'));
    flour = (await TestBed.inject(SaveIngredient).execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') })).id;
  });

  const save = (name: string, value = 1000) =>
    TestBed.inject(SaveRecipe).execute({
      categoryId: CAT,
      name,
      values: [{ propertyId: PESO, value }],
      lines: [{ ingredientId: flour, quantity: 250 }],
    });

  it('saves a recipe and emits RecipeSaved', async () => {
    const { id } = await save('Vainilla');
    const recipe = await TestBed.inject(RecipeRepository).byId(new EntityId(id));
    expect(recipe?.name).toBe('Vainilla');
    expect(recipe?.weightFor(PESO)?.value).toBe(1000);
    expect(bus.names()).toContain('RecipeSaved');
  });

  it('upserts by (category, name): same name reuses the id', async () => {
    const first = await save('Vainilla', 1000);
    const second = await save('Vainilla', 2000);
    expect(second.id).toBe(first.id);
    expect((await TestBed.inject(RecipeRepository).all())).toHaveLength(1);
  });

  it('rejects when a required property is missing', async () => {
    await expect(
      TestBed.inject(SaveRecipe).execute({
        categoryId: CAT,
        name: 'Sin peso',
        values: [],
        lines: [{ ingredientId: flour, quantity: 250 }],
      }),
    ).rejects.toThrow();
  });

  it('rejects when a referenced ingredient does not exist', async () => {
    await expect(
      TestBed.inject(SaveRecipe).execute({
        categoryId: CAT,
        name: 'Fantasma',
        values: [{ propertyId: PESO, value: 1000 }],
        lines: [{ ingredientId: 'IN-nope', quantity: 100 }],
      }),
    ).rejects.toThrow();
  });
});
