import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { BaseUnit } from '../../../_common/quantity';
import { EventBus } from '../../../_common/event-bus';
import { Ingredient } from '../../domain/entities/ingredient';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

export interface SaveIngredientRequest {
    name: string;
    baseUnit: BaseUnit;
}

/**
 * Saves a raw material. Upsert by name (case-insensitive): a matching name
 * updates the existing aggregate; otherwise a new identity is minted. Keeps
 * the §11.2 name-uniqueness invariant.
 */
@Injectable({ providedIn: 'root' })
export class SaveIngredient extends UseCase<SaveIngredientRequest, { id: string }> {
    private readonly ingredients = inject(IngredientRepository);
    private readonly bus = inject(EventBus);

    async execute({ name, baseUnit }: SaveIngredientRequest): Promise<{ id: string }> {
        const existing = await this.ingredients.byName(name);
        const id = existing?.id ?? this.ingredients.nextIdentity();
        const ingredient = Ingredient.create(id, name, baseUnit);

        await this.ingredients.save(ingredient);
        await this.bus.publish([RecipeBookEvents.ingredientSaved(id.value, !existing)]);
        return { id: id.value };
    }
}
