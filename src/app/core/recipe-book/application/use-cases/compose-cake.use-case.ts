import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/event-bus';
import { CakeComposition } from '../../domain/entities/cake-composition';
import { CakeCompositionRepository } from '../../domain/repositories/cake-composition.repository';
import { SpongeRecipeRepository } from '../../domain/repositories/sponge-recipe.repository';
import { FillingRecipeRepository } from '../../domain/repositories/filling-recipe.repository';
import { CoveringRecipeRepository } from '../../domain/repositories/covering-recipe.repository';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { PackagingRuleRepository } from '../../domain/repositories/packaging-rule.repository';
import { CakeScalingService, ScaledIngredient } from '../../domain/services/cake-scaling.service';
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
 * that moves the goal). The "needs at least one line" / scaling rules live in
 * the domain — this use case only orchestrates.
 */
@Injectable({ providedIn: 'root' })
export class ComposeCake extends UseCase<ComposeCakeRequest, ComposeCakeResult> {
    private readonly compositions = inject(CakeCompositionRepository);
    private readonly sponges = inject(SpongeRecipeRepository);
    private readonly fillings = inject(FillingRecipeRepository);
    private readonly coverings = inject(CoveringRecipeRepository);
    private readonly ingredients = inject(IngredientRepository);
    private readonly rules = inject(PackagingRuleRepository);
    private readonly scaling = inject(CakeScalingService);
    private readonly bus = inject(EventBus);

    async execute(request: ComposeCakeRequest): Promise<ComposeCakeResult> {
        const targetWeight = Quantity.of(request.targetWeightGrams, 'g');

        const sponge = await this.sponges.byId(new EntityId(request.spongeId));
        const filling = await this.fillings.byId(new EntityId(request.fillingId));
        const covering = await this.coverings.byId(new EntityId(request.coveringId));
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
        const scaled = this.scaling.scale({ composition, sponge, filling, covering });
        await this.bus.publish([RecipeBookEvents.cakeComposed(id.value)]);

        return { composition, scaled };
    }
}
