import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/event-bus';
import { Recipe } from '../../domain/entities/recipe';
import { IngredientLine } from '../../domain/value-objects/ingredient-line';
import { RecipePropertyValue } from '../../domain/value-objects/recipe-property-value';
import { RecipeCategoryRepository } from '../../domain/repositories/recipe-category.repository';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

interface RecipeValueInput {
    propertyId: string;
    value: string | number; // peso → gramos; número → número; texto → string
}

interface RecipeLineInput {
    ingredientId: string;
    quantity: number;
}

export interface SaveRecipeRequest {
    categoryId: string;
    name: string;
    values: RecipeValueInput[];
    lines: RecipeLineInput[];
}

/**
 * Guarda una receta dentro de su categoría. Upsert por (categoría, nombre).
 * Construye los valores de propiedad según el esquema de la categoría y valida
 * obligatorias/tipos (la regla vive en `RecipeCategory.validateValues`) y que
 * cada ingrediente exista.
 */
@Injectable({ providedIn: 'root' })
export class SaveRecipe extends UseCase<SaveRecipeRequest, { id: string }> {
    private readonly recipes = inject(RecipeRepository);
    private readonly categories = inject(RecipeCategoryRepository);
    private readonly ingredients = inject(IngredientRepository);
    private readonly bus = inject(EventBus);

    async execute({ categoryId, name, values, lines }: SaveRecipeRequest): Promise<{ id: string }> {
        const categoryEntityId = new EntityId(categoryId);
        const category = await this.categories.byId(categoryEntityId);
        if (!category) {
            throw new Error(`Category ${categoryId} not found`);
        }

        const propertyValues = values.map((input) => this.toValue(category, input));
        category.validateValues(propertyValues);

        const ingredientLines = await this.buildLines(lines);

        const existing = await this.recipes.byNameInCategory(categoryEntityId, name);
        const id = existing?.id ?? this.recipes.nextIdentity();
        const recipe = Recipe.create(id, categoryEntityId, name, propertyValues, ingredientLines);

        await this.recipes.save(recipe);
        await this.bus.publish([RecipeBookEvents.recipeSaved(id.value, !existing, categoryId)]);
        return { id: id.value };
    }

    private toValue(
        category: { property(id: string): { type: 'text' | 'number' | 'weight' } | undefined },
        input: RecipeValueInput,
    ): RecipePropertyValue {
        const property = category.property(input.propertyId);
        if (!property) {
            throw new Error(`Unknown property ${input.propertyId}`);
        }
        if (property.type === 'weight') {
            return RecipePropertyValue.of(input.propertyId, 'weight', Quantity.of(Number(input.value), 'g'));
        }
        if (property.type === 'number') {
            return RecipePropertyValue.of(input.propertyId, 'number', Number(input.value));
        }
        return RecipePropertyValue.of(input.propertyId, 'text', String(input.value));
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
