import { EventBus } from '../../../shared/application/event-bus';
import { UseCase } from '../../../shared/application/use-case';
import { DuplicateError, NotFoundError, ValidationError } from '../../../shared/domain/errors';
import { EntityId } from '../../../shared/domain/entity-id';
import { SupplyRepository } from '../../domain/supply/supply-repository';
import { BaseType, Recipe, RecipeIngredient } from '../../domain/recipe/recipe';
import { RecipeRepository } from '../../domain/recipe/recipe-repository';

export interface SaveRecipeRequest {
  id?: string;
  name: string;
  category?: string;
  baseType: BaseType;
  baseServings: number;
  laborHours?: number;
  ingredients: RecipeIngredient[];
}

/**
 * Create or edit a recipe (src/Recetas.js): unique name, ≥1 ingredient
 * (the aggregate invariant) and every referenced supply must exist and be of
 * type 'ingredient'.
 */
export class SaveRecipe implements UseCase<SaveRecipeRequest, { id: string }> {
  constructor(
    private readonly recipes: RecipeRepository,
    private readonly supplies: SupplyRepository,
    private readonly bus: EventBus,
  ) {}

  async execute(request: SaveRecipeRequest): Promise<{ id: string }> {
    await this.requireValidSupplies(request.ingredients);
    const existing = await this.recipes.byName(request.name);

    if (request.id) {
      const id = EntityId.of(request.id);
      const recipe = await this.recipes.byId(id);
      if (!recipe) throw new NotFoundError('Recipe', request.id);
      if (existing && !existing.id.equals(id)) {
        throw new DuplicateError('A recipe with that name already exists.');
      }
      recipe.edit(request);
      await this.recipes.save(recipe);
      await this.bus.publish(recipe.pullEvents());
      return { id: recipe.id.value };
    }

    if (existing) throw new DuplicateError('A recipe with that name already exists.');
    const recipe = Recipe.create(await this.recipes.nextId(), request);
    await this.recipes.save(recipe);
    await this.bus.publish(recipe.pullEvents());
    return { id: recipe.id.value };
  }

  private async requireValidSupplies(ingredients: RecipeIngredient[]): Promise<void> {
    for (const line of ingredients ?? []) {
      if (!line.supplyId || line.baseQuantity <= 0) continue; // inert lines are filtered by the AR
      const supply = await this.supplies.byId(EntityId.of(line.supplyId));
      if (!supply) throw new NotFoundError('Supply', line.supplyId);
      if (supply.type !== 'ingredient') {
        throw new ValidationError(`"${supply.name}" is packaging: it cannot be used as an ingredient.`);
      }
    }
  }
}
