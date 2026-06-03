import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryEventBus } from '../../../_common/application/event-bus';
import { DuplicateError, ValidationError } from '../../../_common/domain/errors';
import {
  MemoryPackagingRuleRepository,
  MemoryRecipeRepository,
  MemorySupplyRepository,
} from '../../infrastructure/memory-repositories';
import { SaveSupply } from '../save-supply/save-supply';
import { SaveRecipe } from '../save-recipe/save-recipe';
import { SavePackagingRule } from './save-packaging-rule';

describe('SavePackagingRule (use case)', () => {
  let rules: MemoryPackagingRuleRepository;
  let recipes: MemoryRecipeRepository;
  let supplies: MemorySupplyRepository;
  let useCase: SavePackagingRule;
  let recipeId: string;
  let boxId: string;
  let flourId: string;

  beforeEach(async () => {
    rules = new MemoryPackagingRuleRepository();
    recipes = new MemoryRecipeRepository();
    supplies = new MemorySupplyRepository();
    const bus = new InMemoryEventBus();
    const sizes = { names: async () => ['chico', 'mediano', 'grande'] };
    useCase = new SavePackagingRule(rules, recipes, supplies, sizes, bus);

    const saveSupply = new SaveSupply(supplies, bus);
    flourId = (
      await saveSupply.execute({
        name: 'Harina', type: 'ingredient', baseUnit: 'g',
        presentationSize: 1000, presentationPriceSoles: 5,
      })
    ).id;
    boxId = (
      await saveSupply.execute({
        name: 'Caja torta', type: 'packaging', baseUnit: 'u',
        presentationSize: 25, presentationPriceSoles: 25,
      })
    ).id;
    recipeId = (
      await new SaveRecipe(recipes, supplies, bus).execute({
        name: 'Torta chocolate', baseType: 'people', baseServings: 10,
        ingredients: [{ supplyId: flourId, baseQuantity: 300 }],
      })
    ).id;
  });

  it('creates the rule RL-0001 for recipe + size + packaging', async () => {
    const r = await useCase.execute({ recipeId, size: 'Grande', packagingSupplyId: boxId, quantity: 1 });
    expect(r.id).toBe('RL-0001');
    const suggested = await rules.byRecipeAndSize((await recipes.byName('Torta chocolate'))!.id, 'grande');
    expect(suggested).toHaveLength(1);
  });

  it('rejects the duplicate triple and sizes outside configuration', async () => {
    await useCase.execute({ recipeId, size: 'grande', packagingSupplyId: boxId, quantity: 1 });
    await expect(
      useCase.execute({ recipeId, size: 'grande', packagingSupplyId: boxId, quantity: 2 }),
    ).rejects.toThrow(DuplicateError);
    await expect(
      useCase.execute({ recipeId, size: 'gigante', packagingSupplyId: boxId, quantity: 1 }),
    ).rejects.toThrow(ValidationError);
  });

  it('rejects using an ingredient as packaging', async () => {
    await expect(
      useCase.execute({ recipeId, size: 'chico', packagingSupplyId: flourId, quantity: 1 }),
    ).rejects.toThrow(ValidationError);
  });
});
