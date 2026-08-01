import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/eventbus/event-bus';
import { Recipe } from '../../domain/entities/recipe';
import { RecipeIngredient } from '../../domain/value-objects/recipe-ingredient';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { SupplyRepository } from '../../domain/repositories/supply.repository';
import { RecipeFlavorRepository } from '../../domain/repositories/recipe-flavor.repository';
import { RecipeCapacityRepository } from '../../domain/repositories/recipe-capacity.repository';

/** Un ingrediente de la receta: el insumo (por id) y cuánto lleva, en la unidad base del insumo. */
export interface RecipeIngredientInput {
  supplyId: string;
  quantity: number;
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
 * **Persiste** una receta. La invocan las pantallas de receta del recetario. No hay crear ni editar:
 * si el id no existe se inserta y si existe se actualiza, sin ninguna diferencia — lo resuelve el
 * upsert de `RecipeRepository.save`.
 *
 * Resuelve cada insumo por id (para tomar su unidad base) y arma los ingredientes; si se dan
 * `flavorId`/`portionsCapacityId`/`moldCapacityId`, valida que existan (igual que con los insumos).
 * Resolver ids contra los repositorios es lo único que aporta: las invariantes ("nombre obligatorio",
 * "al menos un ingrediente") viven en `Recipe`, y el evento `RecipeSaved` **lo graba el propio
 * agregado** al armarse. Este use case solo orquesta: arma → persiste → saca la cola del agregado
 * con `pullEvents()` y la publica por el `EventBus`.
 */
@Injectable({ providedIn: 'root' })
export class SaveRecipe extends UseCase<SaveRecipeRequest, { id: string }> {
  private readonly recipes = inject(RecipeRepository);
  private readonly supplies = inject(SupplyRepository);
  private readonly flavors = inject(RecipeFlavorRepository);
  private readonly capacities = inject(RecipeCapacityRepository);
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
    const resolvedIngredients = await this.buildIngredients(ingredients);
    const resolvedFlavorId = await this.resolveFlavorId(flavorId);
    const resolvedPortionsCapacityId = await this.resolveCapacityId(portionsCapacityId);
    const resolvedMoldCapacityId = await this.resolveCapacityId(moldCapacityId);
    const recipe = Recipe.create(
      recipeId,
      new EntityId(categoryId),
      name,
      resolvedIngredients,
      resolvedFlavorId,
      resolvedPortionsCapacityId,
      resolvedMoldCapacityId,
    );
    await this.recipes.save(recipe);
    await this.bus.publish(recipe.pullEvents());
    return { id: recipeId.value };
  }

  private async resolveFlavorId(flavorId: string | null | undefined): Promise<EntityId | null> {
    if (!flavorId) {
      return null;
    }
    const id = new EntityId(flavorId);
    const flavor = await this.flavors.byId(id);
    if (!flavor) {
      throw new Error(`Flavor ${flavorId} does not exist`);
    }
    return id;
  }

  private async resolveCapacityId(capacityId: string | null | undefined): Promise<EntityId | null> {
    if (!capacityId) {
      return null;
    }
    const id = new EntityId(capacityId);
    const capacity = await this.capacities.byId(id);
    if (!capacity) {
      throw new Error(`Capacity ${capacityId} does not exist`);
    }
    return id;
  }

  /** Resuelve cada insumo por id para tomar su unidad base y armar el ingrediente. */
  private async buildIngredients(ingredients: RecipeIngredientInput[]): Promise<RecipeIngredient[]> {
    const built: RecipeIngredient[] = [];
    for (const ingredient of ingredients) {
      const supplyId = new EntityId(ingredient.supplyId);
      const supply = await this.supplies.byId(supplyId);
      if (!supply) {
        throw new Error(`Supply ${ingredient.supplyId} does not exist`);
      }
      built.push(RecipeIngredient.of(supplyId, Quantity.of(ingredient.quantity, supply.baseUnit)));
    }
    return built;
  }
}
