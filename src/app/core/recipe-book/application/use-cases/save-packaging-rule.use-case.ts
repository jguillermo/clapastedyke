import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/event-bus';
import { PackagingRule } from '../../domain/entities/packaging-rule';
import { WeightRange } from '../../domain/value-objects/weight-range';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { PackagingRuleRepository } from '../../domain/repositories/packaging-rule.repository';
import { PackagingRuleOverlapPolicy } from '../../domain/services/packaging-rule-overlap.policy';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

export interface SavePackagingRuleRequest {
    range: { minGrams: number; maxGrams: number };
    boxId: string;
    baseId: string;
}

/**
 * Saves a packaging rule. Validates that the box and base exist and are of the
 * right type, and that the band does not overlap any existing rule (§11.2).
 * Create-only — packaging rules carry no name to upsert by.
 */
@Injectable({ providedIn: 'root' })
export class SavePackagingRule extends UseCase<SavePackagingRuleRequest, { id: string }> {
    private readonly rules = inject(PackagingRuleRepository);
    private readonly ingredients = inject(IngredientRepository);
    private readonly overlapPolicy = inject(PackagingRuleOverlapPolicy);
    private readonly bus = inject(EventBus);

    async execute({ range, boxId, baseId }: SavePackagingRuleRequest): Promise<{ id: string }> {
        const box = await this.ingredients.byId(new EntityId(boxId));
        if (!box || box.usage !== 'box') {
            throw new Error(`Ingredient ${boxId} must exist and have usage 'box'`);
        }
        const base = await this.ingredients.byId(new EntityId(baseId));
        if (!base || base.usage !== 'base') {
            throw new Error(`Ingredient ${baseId} must exist and have usage 'base'`);
        }

        const weightRange = WeightRange.of(Quantity.of(range.minGrams, 'g'), Quantity.of(range.maxGrams, 'g'));
        this.overlapPolicy.ensureNoOverlap(weightRange, await this.rules.all());

        const id = this.rules.nextIdentity();
        const rule = PackagingRule.create(id, weightRange, box.id, base.id);
        await this.rules.save(rule);
        await this.bus.publish([RecipeBookEvents.packagingRuleSaved(id.value)]);
        return { id: id.value };
    }
}
