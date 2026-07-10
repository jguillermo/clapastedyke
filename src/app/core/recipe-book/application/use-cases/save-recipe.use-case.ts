import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/event-bus';
import { Recipe } from '../../domain/entities/recipe';
import { SupplyLine } from '../../domain/value-objects/supply-line';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { SupplyRepository } from '../../domain/repositories/supply.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

/** Una línea de la receta: el insumo (por id) y su cantidad en la unidad base del insumo. */
export interface RecipeLineInput {
    supplyId: string;
    quantity: number;
}

/** Entrada de {@link SaveRecipe}: categoría, nombre y líneas de insumo (con id para editar, sin id para crear). */
export interface SaveRecipeRequest {
    id?: string; // presente → editar; ausente → crear
    categoryId: string;
    name: string;
    lines: RecipeLineInput[];
}

/**
 * Guarda una receta (crea o edita). La invocan las pantallas de alta/edición de receta del
 * recetario. Resuelve cada insumo por id (para tomar su unidad base) y arma las `SupplyLine`; la
 * regla "al menos una línea" vive en `Recipe`. El use case orquesta: construye el agregado y lo
 * persiste — **no decide crear-vs-editar**, eso es responsabilidad de la infraestructura
 * (`RecipeRepository.save` es un upsert por id). Publica `RecipeSaved` vía EventBus.
 */
@Injectable({ providedIn: 'root' })
export class SaveRecipe extends UseCase<SaveRecipeRequest, { id: string }> {
    private readonly recipes = inject(RecipeRepository);
    private readonly supplies = inject(SupplyRepository);
    private readonly bus = inject(EventBus);

    async execute({ id, categoryId, name, lines }: SaveRecipeRequest): Promise<{ id: string }> {
        const recipeId = id ? new EntityId(id) : this.recipes.nextIdentity();
        const supplyLines = await this.buildLines(lines);
        const recipe = Recipe.create(recipeId, new EntityId(categoryId), name, supplyLines);
        await this.recipes.save(recipe);
        await this.bus.publish([RecipeBookEvents.recipeSaved(recipeId.value, !id, categoryId)]);
        return { id: recipeId.value };
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
