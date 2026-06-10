import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/event-bus';
import { FillingRecipe } from '../../domain/entities/filling-recipe';
import { IngredientLine } from '../../domain/value-objects/ingredient-line';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { FillingRecipeRepository } from '../../domain/repositories/filling-recipe.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

interface RecipeLineInput {
    ingredientId: string;
    quantity: number;
}

export interface SaveFillingRecipeRequest {
    name: string;
    referenceWeightGrams: number;
    lines: RecipeLineInput[];
}

/**
 * Saves the filling recipe. Upsert by name; builds value objects from the
 * primitive request and validates that every referenced ingredient exists
 * (§11.2). The reference weight is stored in grams.
 */
@Injectable({ providedIn: 'root' })
export class SaveFillingRecipe extends UseCase<SaveFillingRecipeRequest, { id: string }> {
    private readonly recipes = inject(FillingRecipeRepository);
    private readonly ingredients = inject(IngredientRepository);
    private readonly bus = inject(EventBus);

    async execute({ name, referenceWeightGrams, lines }: SaveFillingRecipeRequest): Promise<{ id: string }> {
        const existing = await this.recipes.byName(name);
        const id = existing?.id ?? this.recipes.nextIdentity();
        const ingredientLines = await this.buildLines(lines);

        const recipe = FillingRecipe.create(id, name, Quantity.of(referenceWeightGrams, 'g'), ingredientLines);
        await this.recipes.save(recipe);
        await this.bus.publish([RecipeBookEvents.fillingRecipeSaved(id.value, !existing)]);
        return { id: id.value };
    }

    private async buildLines(lines: RecipeLineInput[]): Promise<IngredientLine[]> {
        const built: IngredientLine[] = [];
        for (const line of lines) {
            const ingredientId = new EntityId(line.ingredientId);
            const ingredient = await this.ingredients.byId(ingredientId);
            if (!ingredient) {
                throw new Error(`Ingredient ${line.ingredientId} does not exist`);
            }
            built.push(IngredientLine.of(ingredientId, Quantity.of(line.quantity, ingredient.baseUnit)));
        }
        return built;
    }
}
