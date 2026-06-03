import { UseCase } from '../../../shared/application/use-case';
import { RecipePrimitives } from '../../domain/recipe/recipe';
import { RecipeRepository } from '../../domain/recipe/recipe-repository';

export class ListRecipes implements UseCase<void, RecipePrimitives[]> {
  constructor(private readonly recipes: RecipeRepository) {}

  async execute(): Promise<RecipePrimitives[]> {
    const all = await this.recipes.all();
    return all
      .map(r => r.toPrimitives())
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}
