import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { EventBus } from '../../../_common/event-bus';
import { RecipeSelection } from '../../domain/entities/recipe-selection';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { ConversionOptionRepository } from '../../domain/repositories/conversion-option.repository';
import { RecipeSelectionRepository } from '../../domain/repositories/recipe-selection.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

export interface SelectRecipeRequest {
    recipeId: string;
    flavorLabel?: string;
    portionsOptionId?: string;
    moldOptionId?: string;
}

/**
 * Persiste una selección de receta (sabor + porciones/molde elegidos). Guarda las
 * opciones **por id** (factor vivo del catálogo; factor 1 reservado a la base).
 * Emite `RecipeSelected`. No alimenta progression.
 */
@Injectable({ providedIn: 'root' })
export class SelectRecipe extends UseCase<SelectRecipeRequest, { id: string }> {
    private readonly recipes = inject(RecipeRepository);
    private readonly options = inject(ConversionOptionRepository);
    private readonly selections = inject(RecipeSelectionRepository);
    private readonly bus = inject(EventBus);

    async execute({ recipeId, flavorLabel, portionsOptionId, moldOptionId }: SelectRecipeRequest): Promise<{ id: string }> {
        const recipeEntityId = new EntityId(recipeId);
        const recipe = await this.recipes.byId(recipeEntityId);
        if (!recipe) {
            throw new Error(`Recipe ${recipeId} not found`);
        }
        await this.ensureGroup(portionsOptionId, 'portions');
        await this.ensureGroup(moldOptionId, 'mold');

        const id = this.selections.nextIdentity();
        const selection = RecipeSelection.create(id, recipeEntityId, {
            flavorLabel,
            portionsOptionId: portionsOptionId ? new EntityId(portionsOptionId) : undefined,
            moldOptionId: moldOptionId ? new EntityId(moldOptionId) : undefined,
        });
        await this.selections.save(selection);
        await this.bus.publish([RecipeBookEvents.recipeSelected(id.value, recipeId)]);
        return { id: id.value };
    }

    /** Verifica que la opción exista y pertenezca al grupo esperado. */
    private async ensureGroup(id: string | undefined, group: 'portions' | 'mold'): Promise<void> {
        if (!id) {
            return;
        }
        const option = await this.options.byId(new EntityId(id));
        if (!option) {
            throw new Error(`Conversion option ${id} not found`);
        }
        if (option.group !== group) {
            throw new Error(`Option ${id} does not belong to the "${group}" group`);
        }
    }
}
