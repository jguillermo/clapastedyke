import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { BaseUnit, Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/event-bus';
import { EntityId } from '../../../_common/entity-id';
import { Ingredient } from '../../domain/entities/ingredient';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

export interface UpdateIngredientRequest {
    /** Identity of the ingredient to edit (renaming by id never duplicates it). */
    id: string;
    name: string;
    /** How it is bought: presentation (in base unit) + price + currency. */
    purchasePrice: { amount: number; per: { value: number; unit: BaseUnit }; currency?: string };
}

/**
 * Edits an **existing** ingredient by id: rename and/or re-price in place. Unlike
 * {@link import('./save-ingredient.use-case').SaveIngredient} (upsert by name, used
 * to create), this loads by identity so renaming keeps the same `id` (recipes
 * reference it by id) instead of minting a new ingredient. Rejects a rename that
 * collides with another ingredient's name (case-insensitive). The domain decides:
 * `renamedTo`/`repricedTo` build the new instance; this use case only orchestrates
 * load → mutate → persist and publishes `IngredientSaved` plus any
 * `IngredientRepriced` the aggregate recorded.
 */
@Injectable({ providedIn: 'root' })
export class UpdateIngredient extends UseCase<UpdateIngredientRequest, { id: string }> {
    private readonly ingredients = inject(IngredientRepository);
    private readonly bus = inject(EventBus);

    async execute({ id, name, purchasePrice }: UpdateIngredientRequest): Promise<{ id: string }> {
        const existing = await this.ingredients.byId(new EntityId(id));
        if (!existing) {
            throw new Error('Ingredient not found');
        }

        let ingredient = existing;
        if (name.trim().toLowerCase() !== existing.name.toLowerCase()) {
            const clash = await this.ingredients.byName(name);
            if (clash && !clash.id.equals(existing.id)) {
                throw new Error('Ya existe un insumo con ese nombre');
            }
            ingredient = ingredient.renamedTo(name);
        }

        const price = PurchasePrice.of(
            purchasePrice.amount,
            Quantity.of(purchasePrice.per.value, purchasePrice.per.unit),
            purchasePrice.currency ?? existing.purchasePrice.currency,
        );
        if (!existing.purchasePrice.equals(price)) {
            ingredient = ingredient.repricedTo(price);
        }

        await this.ingredients.save(ingredient);
        await this.bus.publish([
            RecipeBookEvents.ingredientSaved(ingredient.id.value, false),
            ...ingredient.pullEvents(),
        ]);
        return { id: ingredient.id.value };
    }
}
