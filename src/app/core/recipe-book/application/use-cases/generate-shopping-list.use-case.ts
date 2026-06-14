import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { EventBus } from '../../../_common/event-bus';
import { Ingredient } from '../../domain/entities/ingredient';
import { CakeCompositionRepository } from '../../domain/repositories/cake-composition.repository';
import { SpongeRecipeRepository } from '../../domain/repositories/sponge-recipe.repository';
import { FillingRecipeRepository } from '../../domain/repositories/filling-recipe.repository';
import { CoveringRecipeRepository } from '../../domain/repositories/covering-recipe.repository';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { CakeScalingService } from '../../domain/services/cake-scaling.service';
import { ShoppingListBuilder } from '../../domain/services/shopping-list-builder.service';
import { ShoppingCategory } from '../../domain/services/shopping-list';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';
import { formatMeasure, formatSoles } from '../money';

export interface GenerateShoppingListRequest {
    compositionId: string;
}

/** Shopping list ready to paint: quantities and costs already formatted. */
export interface ShoppingListItemView {
    name: string;
    quantity: string;
    cost: string;
    category: ShoppingCategory;
}

export interface ShoppingListView {
    items: ShoppingListItemView[];
    totalCost: string;
}

/**
 * Materializes the shopping list (read model) from a complete composition:
 * scales the recipes, resolves every item as an Ingredient (recipe insumos +
 * topper/box/base) and projects the list with cost per item + total. Returns a
 * **view DTO** with formatted strings (the view never computes nor formats).
 * Emits ShoppingListGenerated.
 */
@Injectable({ providedIn: 'root' })
export class GenerateShoppingList extends UseCase<GenerateShoppingListRequest, ShoppingListView> {
    private readonly compositions = inject(CakeCompositionRepository);
    private readonly sponges = inject(SpongeRecipeRepository);
    private readonly fillings = inject(FillingRecipeRepository);
    private readonly coverings = inject(CoveringRecipeRepository);
    private readonly ingredients = inject(IngredientRepository);
    private readonly scaling = inject(CakeScalingService);
    private readonly builder = inject(ShoppingListBuilder);
    private readonly bus = inject(EventBus);

    async execute({ compositionId }: GenerateShoppingListRequest): Promise<ShoppingListView> {
        const composition = await this.compositions.byId(new EntityId(compositionId));
        if (!composition) {
            throw new Error(`Cake composition ${compositionId} does not exist`);
        }

        const sponge = await this.sponges.byId(composition.spongeRecipeId);
        const filling = await this.fillings.byId(composition.fillingRecipeId);
        const covering = await this.coverings.byId(composition.coveringRecipeId);
        const box = await this.ingredients.byId(composition.suggestedBoxId);
        const base = await this.ingredients.byId(composition.suggestedBaseId);
        if (!sponge || !filling || !covering || !box || !base) {
            throw new Error('Composition is incomplete: a referenced recipe or packaging ingredient is missing');
        }

        const scaled = this.scaling.scale({ composition, sponge, filling, covering });
        const ingredients = await this.loadIngredients(scaled.map((s) => s.ingredientId));
        const topper = composition.topperId ? await this.ingredients.byId(composition.topperId) : null;

        const list = this.builder.build({ scaled, ingredients, box, base, topper: topper ?? undefined });
        await this.bus.publish([RecipeBookEvents.shoppingListGenerated(compositionId, list.items.length)]);

        return {
            items: list.items.map((item) => ({
                name: item.name,
                quantity: formatMeasure(item.totalQuantity),
                cost: formatSoles(item.cost),
                category: item.category,
            })),
            totalCost: formatSoles(list.totalCost),
        };
    }

    private async loadIngredients(ids: EntityId[]): Promise<Ingredient[]> {
        const loaded = await Promise.all(ids.map((id) => this.ingredients.byId(id)));
        return loaded.filter((i): i is Ingredient => i !== null);
    }
}
