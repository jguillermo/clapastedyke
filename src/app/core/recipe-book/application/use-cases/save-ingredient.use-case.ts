import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { BaseUnit, Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/event-bus';
import { Ingredient } from '../../domain/entities/ingredient';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { IngredientUsage } from '../../domain/value-objects/ingredient-usage';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

export interface SaveIngredientRequest {
    name: string;
    baseUnit: BaseUnit;
    usage: IngredientUsage;
    /** How it is bought: presentation (in base unit) + price. */
    purchasePrice: { amount: number; per: { value: number; unit: BaseUnit } };
}

/**
 * Saves an ingredient (any usage). Upsert by name (case-insensitive): a new
 * name mints an identity via `Ingredient.create` (records the initial price);
 * an existing one is re-priced via `repricedTo` only when the price changed.
 * Publishes `IngredientSaved` plus any `IngredientRepriced` the aggregate
 * recorded — the price history is written by the subscriber, not here.
 */
@Injectable({ providedIn: 'root' })
export class SaveIngredient extends UseCase<SaveIngredientRequest, { id: string }> {
    private readonly ingredients = inject(IngredientRepository);
    private readonly bus = inject(EventBus);

    async execute({ name, baseUnit, usage, purchasePrice }: SaveIngredientRequest): Promise<{ id: string }> {
        const price = PurchasePrice.of(
            purchasePrice.amount,
            Quantity.of(purchasePrice.per.value, purchasePrice.per.unit),
        );
        const existing = await this.ingredients.byName(name);

        let ingredient: Ingredient;
        if (!existing) {
            ingredient = Ingredient.create(this.ingredients.nextIdentity(), name, baseUnit, usage, price);
        } else if (!existing.purchasePrice.equals(price)) {
            ingredient = existing.repricedTo(price);
        } else {
            ingredient = existing;
        }

        await this.ingredients.save(ingredient);
        await this.bus.publish([
            RecipeBookEvents.ingredientSaved(ingredient.id.value, !existing),
            ...ingredient.pullEvents(),
        ]);
        return { id: ingredient.id.value };
    }
}
