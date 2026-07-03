import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/event-bus';
import { CakeComposition } from '../../domain/entities/cake-composition';
import { Recipe } from '../../domain/entities/recipe';
import { CakeCompositionRepository } from '../../domain/repositories/cake-composition.repository';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { RecipeCategoryRepository } from '../../domain/repositories/recipe-category.repository';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { PackagingRuleRepository } from '../../domain/repositories/packaging-rule.repository';
import { CakeScalingService, ScalableRecipe, ScaledIngredient } from '../../domain/services/cake-scaling.service';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

export interface ComposeCakeRequest {
    name?: string;
    targetWeightGrams: number;
    spongeId: string;
    fillingId: string;
    coveringId: string;
    topperId?: string;
}

export interface ComposeCakeResult {
    composition: CakeComposition;
    scaled: ScaledIngredient[];
}

/**
 * Composes a cake: resolves the suggested packaging via the rule that covers
 * the target weight, computes the scaled ingredient view with the scaling
 * service, persists the composition and emits CakeComposed (the only event
 * that moves the goal). The recipes are generic `Recipe`s; el peso de escalado
 * sale de la propiedad de peso de su categoría.
 */
@Injectable({ providedIn: 'root' })
export class ComposeCake extends UseCase<ComposeCakeRequest, ComposeCakeResult> {
    private readonly compositions = inject(CakeCompositionRepository);
    private readonly recipes = inject(RecipeRepository);
    private readonly categories = inject(RecipeCategoryRepository);
    private readonly ingredients = inject(IngredientRepository);
    private readonly rules = inject(PackagingRuleRepository);
    private readonly scaling = inject(CakeScalingService);
    private readonly bus = inject(EventBus);

    async execute(request: ComposeCakeRequest): Promise<ComposeCakeResult> {
        const targetWeight = Quantity.of(request.targetWeightGrams, 'g');

        const sponge = await this.recipes.byId(new EntityId(request.spongeId));
        const filling = await this.recipes.byId(new EntityId(request.fillingId));
        const covering = await this.recipes.byId(new EntityId(request.coveringId));
        if (!sponge || !filling || !covering) {
            throw new Error('Sponge, filling and covering must all be selected and exist');
        }
        if (request.topperId) {
            const topper = await this.ingredients.byId(new EntityId(request.topperId));
            if (!topper || topper.usage !== 'topper') {
                throw new Error(`Ingredient ${request.topperId} must exist and have usage 'topper'`);
            }
        }

        const rule = (await this.rules.all()).find((r) => r.matches(targetWeight));
        if (!rule) {
            throw new Error('No hay caja para este peso. Define una regla de empaque que lo cubra.');
        }

        const id = this.compositions.nextIdentity();
        const composition = CakeComposition.compose({
            id,
            name: request.name,
            targetWeight,
            spongeRecipeId: sponge.id,
            fillingRecipeId: filling.id,
            coveringRecipeId: covering.id,
            topperId: request.topperId ? new EntityId(request.topperId) : undefined,
            suggestedBoxId: rule.boxId,
            suggestedBaseId: rule.baseId,
        });

        await this.compositions.save(composition);
        const scalable = await Promise.all([sponge, filling, covering].map((r) => this.toScalable(r)));
        const scaled = this.scaling.scale({ composition, recipes: scalable });
        await this.bus.publish([RecipeBookEvents.cakeComposed(id.value)]);

        return { composition, scaled };
    }

    /** Resuelve el peso de escalado de una receta desde la propiedad de peso de su categoría. */
    private async toScalable(recipe: Recipe): Promise<ScalableRecipe> {
        const category = await this.categories.byId(recipe.categoryId);
        const weightProperty = category?.weightProperty();
        const weight = weightProperty ? recipe.weightFor(weightProperty.id) : undefined;
        if (!weight) {
            throw new Error(`Recipe "${recipe.name}" has no scaling weight`);
        }
        return { lines: recipe.lines, weight };
    }
}
