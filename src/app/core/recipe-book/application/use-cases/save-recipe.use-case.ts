import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/eventbus/event-bus';
import { Recipe } from '../../domain/entities/recipe';
import { SupplyLine } from '../../domain/value-objects/supply-line';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { SupplyRepository } from '../../domain/repositories/supply.repository';
import { RecipeFlavorRepository } from '../../domain/repositories/recipe-flavor.repository';
import { RecipeCapacityRepository } from '../../domain/repositories/recipe-capacity.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

/** Una línea de la receta: el insumo (por id) y su cantidad en la unidad base del insumo. */
export interface RecipeLineInput {
  supplyId: string;
  quantity: number;
}

/** Entrada de {@link SaveRecipe}: categoría, nombre, líneas de insumo, sabor y capacidades opcionales (con id para editar, sin id para crear). */
export interface SaveRecipeRequest {
  id?: string; // presente → editar; ausente → crear
  categoryId: string;
  name: string;
  lines: RecipeLineInput[];
  flavorId?: string | null; // sabor de la receta, opcional
  portionsCapacityId?: string | null; // capacidad por porciones, opcional (coexiste con la de molde)
  moldCapacityId?: string | null; // capacidad por molde, opcional (coexiste con la de porciones)
}

/**
 * Guarda una receta (crea o edita). La invocan las pantallas de alta/edición de receta del
 * recetario. Resuelve cada insumo por id (para tomar su unidad base) y arma las `SupplyLine`; la
 * regla "al menos una línea" vive en `Recipe`. Si se dan `flavorId`/`portionsCapacityId`/
 * `moldCapacityId`, valida que existan (igual que hace con los insumos). El use case orquesta:
 * construye el agregado y lo persiste — **no decide crear-vs-editar**, eso es responsabilidad de la
 * infraestructura (`RecipeRepository.save` es un upsert por id). Publica `RecipeSaved` vía EventBus.
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
    lines,
    flavorId,
    portionsCapacityId,
    moldCapacityId,
  }: SaveRecipeRequest): Promise<{ id: string }> {
    const recipeId = id ? new EntityId(id) : this.recipes.nextIdentity();
    const supplyLines = await this.buildLines(lines);
    const resolvedFlavorId = await this.resolveFlavorId(flavorId);
    const resolvedPortionsCapacityId = await this.resolveCapacityId(portionsCapacityId);
    const resolvedMoldCapacityId = await this.resolveCapacityId(moldCapacityId);
    const recipe = Recipe.create(
      recipeId,
      new EntityId(categoryId),
      name,
      supplyLines,
      resolvedFlavorId,
      resolvedPortionsCapacityId,
      resolvedMoldCapacityId,
    );
    await this.recipes.save(recipe);
    await this.bus.publish([RecipeBookEvents.recipeSaved(recipeId.value, !id, categoryId)]);
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

  private async buildLines(lines: RecipeLineInput[]): Promise<SupplyLine[]> {
    const built: SupplyLine[] = [];
    for (const line of lines) {
      const supplyId = new EntityId(line.supplyId);
      const supply = await this.supplies.byId(supplyId);
      if (!supply) {
        throw new Error(`Supply ${line.supplyId} does not exist`);
      }
      built.push(SupplyLine.of(supplyId, Quantity.of(line.quantity, supply.baseUnit)));
    }
    return built;
  }
}
