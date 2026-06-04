import { Injectable, inject } from '@angular/core';
import { UseCase } from '../../../_common/application/use-case';
import { RecipePrimitives } from '../../domain/recipe/recipe';
import { RECIPE_REPOSITORY } from '../../domain/recipe/recipe-repository';

@Injectable({ providedIn: 'root' })
export class ListRecipes implements UseCase<void, RecipePrimitives[]> {
  private readonly recipes = inject(RECIPE_REPOSITORY);

  async execute(): Promise<RecipePrimitives[]> {
    const all = await this.recipes.all();
    return all
      .map(r => r.toPrimitives())
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}
