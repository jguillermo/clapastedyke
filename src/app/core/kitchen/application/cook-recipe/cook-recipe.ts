import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { EntityId } from '../../../_common/domain/entity-id';
import { NotFoundError, ValidationError } from '../../../_common/domain/errors';
import { RECIPE_REPOSITORY } from '../../../catalog/domain/recipe/recipe-repository';
import { StockService } from '../../../inventory/domain/stock-service';
import { Production } from '../../domain/production/production';
import { PRODUCTION_REPOSITORY } from '../../domain/production/production-repository';
import { CheckIngredients } from '../check-ingredients/check-ingredients';

export interface CookRecipeRequest {
  recipeId: string;
  servings?: number;
}

/**
 * Cocina una receta: descuenta del stock lo que consume (vía StockService),
 * registra la Production y emite RecipeCooked. Requiere ingredientes
 * suficientes (lo valida CheckIngredients antes de consumir).
 */
@Injectable({ providedIn: 'root' })
export class CookRecipe implements UseCase<CookRecipeRequest, { productionId: string }> {
  private readonly recipes = inject(RECIPE_REPOSITORY);
  private readonly stock = inject(StockService);
  private readonly productions = inject(PRODUCTION_REPOSITORY);
  private readonly check = inject(CheckIngredients);
  private readonly bus = inject(EventBusToken);

  async execute({ recipeId, servings }: CookRecipeRequest): Promise<{ productionId: string }> {
    const recipe = await this.recipes.byId(EntityId.of(recipeId));
    if (!recipe) throw new NotFoundError('Recipe', recipeId);

    const target = servings ?? recipe.baseServings;
    const review = await this.check.execute({ recipeId, servings: target });
    if (!review.canCook) {
      throw new ValidationError('Not enough ingredients to cook this recipe.');
    }

    const id = await this.productions.nextId();
    const factor = target / recipe.baseServings;
    for (const ing of recipe.ingredients) {
      await this.stock.moveById(
        EntityId.of(ing.supplyId),
        -(ing.baseQuantity * factor),
        'consumption',
        id.value,
        `Cooked ${recipe.name}`,
      );
    }

    const production = Production.cook(id, { recipeId, recipeName: recipe.name, servings: target });
    await this.productions.save(production);
    await this.bus.publish(production.pullEvents());
    return { productionId: id.value };
  }
}
