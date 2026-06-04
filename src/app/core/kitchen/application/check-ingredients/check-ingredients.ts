import { Injectable, inject } from '@angular/core';
import { UseCase } from '../../../_common/application/use-case';
import { EntityId } from '../../../_common/domain/entity-id';
import { NotFoundError } from '../../../_common/domain/errors';
import { RECIPE_REPOSITORY } from '../../../catalog/domain/recipe/recipe-repository';
import { SUPPLY_REPOSITORY } from '../../../catalog/domain/supply/supply-repository';
import { StockStatus } from '../../../catalog/domain/supply/supply';
import { IngredientCheck, RecipeCheck } from '../../domain/ingredient-check';

export interface CheckIngredientsRequest {
  recipeId: string;
  /** Raciones a preparar; por defecto, las de la receta (factor 1). */
  servings?: number;
}

/**
 * Revisa si alcanzan los ingredientes para cocinar una receta: escala las
 * cantidades por el factor y las compara con el stock de cada almacén.
 * Fuente de verdad: .claude/doc/plan_de_negocio.md (kitchen.CheckIngredients).
 */
@Injectable({ providedIn: 'root' })
export class CheckIngredients implements UseCase<CheckIngredientsRequest, RecipeCheck> {
  private readonly recipes = inject(RECIPE_REPOSITORY);
  private readonly supplies = inject(SUPPLY_REPOSITORY);

  async execute({ recipeId, servings }: CheckIngredientsRequest): Promise<RecipeCheck> {
    const recipe = await this.recipes.byId(EntityId.of(recipeId));
    if (!recipe) throw new NotFoundError('Recipe', recipeId);

    const target = servings ?? recipe.baseServings;
    const factor = target / recipe.baseServings;

    const items: IngredientCheck[] = [];
    for (const ing of recipe.ingredients) {
      const supply = await this.supplies.byId(EntityId.of(ing.supplyId));
      const needed = ing.baseQuantity * factor;
      const have = supply?.stock ?? 0;
      const status = have <= 0 ? StockStatus.EMPTY : have < needed ? StockStatus.LOW : StockStatus.OK;
      items.push({
        supplyId: ing.supplyId,
        name: supply?.name ?? '—',
        unit: supply?.baseUnit ?? 'u',
        needed,
        have,
        status,
        enough: have >= needed,
      });
    }

    return {
      recipeId,
      recipeName: recipe.name,
      servings: target,
      canCook: items.every(i => i.enough),
      items,
    };
  }
}
