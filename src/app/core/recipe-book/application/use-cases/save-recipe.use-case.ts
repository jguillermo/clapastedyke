import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { BaseUnit, Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/eventbus/event-bus';
import { Recipe } from '../../domain/entities/recipe';
import { RecipeIngredient } from '../../domain/value-objects/recipe-ingredient';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';

/** Un ingrediente de la receta: el insumo (por id) y cuánto lleva, en su unidad base. */
export interface RecipeIngredientInput {
  supplyId: string;
  quantity: number;
  unit: BaseUnit;
}

/** Entrada de {@link SaveRecipe}: categoría, nombre, ingredientes, sabor y capacidades opcionales. */
export interface SaveRecipeRequest {
  id?: string; // identidad sobre la que persistir; ausente → se acuña una nueva
  categoryId: string;
  name: string;
  ingredients: RecipeIngredientInput[];
  flavorId?: string | null; // sabor de la receta, opcional
  portionsCapacityId?: string | null; // capacidad por porciones, opcional (coexiste con la de molde)
  moldCapacityId?: string | null; // capacidad por molde, opcional (coexiste con la de porciones)
}

/**
 * **Persiste** una receta. No hay crear ni editar: si el id no existe se inserta y si existe se
 * actualiza, sin ninguna diferencia — lo resuelve el upsert de `RecipeRepository.save`.
 *
 * Recibe **los datos ya resueltos** (ids de insumo, de sabor y de capacidad) y no comprueba que
 * existan: eso son otros agregados, con sus propios casos de uso, y mirarlos desde aquí solo añadiría
 * lecturas y acoplamiento sin impedir nada de verdad. Este use case toca **un** repositorio, el suyo.
 *
 * Las invariantes de la receta («nombre obligatorio», «al menos un ingrediente») viven en `Recipe`, y
 * el evento `RecipeSaved` **lo graba el propio agregado** al armarse. Aquí solo: arma → persiste →
 * saca la cola con `pullEvents()` y la publica por el `EventBus`.
 */
@Injectable({ providedIn: 'root' })
export class SaveRecipe extends UseCase<SaveRecipeRequest, { id: string }> {
  private readonly recipes = inject(RecipeRepository);
  private readonly bus = inject(EventBus);

  async execute({
    id,
    categoryId,
    name,
    ingredients,
    flavorId,
    portionsCapacityId,
    moldCapacityId,
  }: SaveRecipeRequest): Promise<{ id: string }> {
    const recipeId = id ? new EntityId(id) : this.recipes.nextIdentity();
    const recipe = Recipe.create(
      recipeId,
      new EntityId(categoryId),
      name,
      ingredients.map((ingredient) =>
        RecipeIngredient.of(
          new EntityId(ingredient.supplyId),
          Quantity.of(ingredient.quantity, ingredient.unit),
        ),
      ),
      flavorId ? new EntityId(flavorId) : null,
      portionsCapacityId ? new EntityId(portionsCapacityId) : null,
      moldCapacityId ? new EntityId(moldCapacityId) : null,
    );

    await this.recipes.save(recipe);
    await this.bus.publish(recipe.pullEvents());
    return { id: recipeId.value };
  }
}
