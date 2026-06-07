import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/event-bus';
import { SpongeRecipe } from '../../domain/entities/sponge-recipe';
import { IngredientLine } from '../../domain/value-objects/ingredient-line';
import { RecipeYield } from '../../domain/value-objects/recipe-yield';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { SpongeRecipeRepository } from '../../domain/repositories/sponge-recipe.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

interface RecipeLineInput {
    ingredientId: string;
    quantity: number;
}

export interface SaveSpongeRecipeRequest {
    name: string;
    flavor?: string;
    referenceYield: { weightGrams: number; servings?: number };
    lines: RecipeLineInput[];
}

/**
 * Saves the sponge recipe. Upsert by name; builds value objects from the
 * primitive request and validates that every referenced ingredient exists
 * (§11.2). The reference weight is stored in grams.
 */
@Injectable({ providedIn: 'root' })
export class SaveSpongeRecipe extends UseCase<SaveSpongeRecipeRequest, { id: string }> {
    private readonly recipes = inject(SpongeRecipeRepository);
    private readonly ingredients = inject(IngredientRepository);
    private readonly bus = inject(EventBus);

    async execute({ name, flavor, referenceYield, lines }: SaveSpongeRecipeRequest): Promise<{ id: string }> {
        const existing = await this.recipes.byName(name);
        const id = existing?.id ?? this.recipes.nextIdentity();
        const recipeYield = RecipeYield.of(Quantity.of(referenceYield.weightGrams, 'g'), referenceYield.servings);
        const ingredientLines = await this.buildLines(lines);

        const recipe = SpongeRecipe.create(id, name, recipeYield, ingredientLines, flavor);
        await this.recipes.save(recipe);
        await this.bus.publish([RecipeBookEvents.spongeRecipeSaved(id.value, !existing)]);
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
