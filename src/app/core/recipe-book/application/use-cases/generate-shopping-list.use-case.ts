import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { EventBus } from '../../../_common/event-bus';
import { Ingredient } from '../../domain/entities/ingredient';
import { CakeCompositionRepository } from '../../domain/repositories/cake-composition.repository';
import { SpongeRecipeRepository } from '../../domain/repositories/sponge-recipe.repository';
import { FillingRecipeRepository } from '../../domain/repositories/filling-recipe.repository';
import { CoveringRecipeRepository } from '../../domain/repositories/covering-recipe.repository';
import { TopperRepository } from '../../domain/repositories/topper.repository';
import { PackagingItemRepository } from '../../domain/repositories/packaging-item.repository';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { CakeScalingService } from '../../domain/services/cake-scaling.service';
import { ShoppingListBuilder } from '../../domain/services/shopping-list-builder.service';
import { ShoppingList } from '../../domain/services/shopping-list';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

export interface GenerateShoppingListRequest {
    compositionId: string;
}

/**
 * Materializes the shopping list (read model) from a complete composition:
 * scales the recipes, resolves names from the loaded aggregates and projects
 * the list with the builder. Emits ShoppingListGenerated.
 */
@Injectable({ providedIn: 'root' })
export class GenerateShoppingList extends UseCase<GenerateShoppingListRequest, ShoppingList> {
    private readonly compositions = inject(CakeCompositionRepository);
    private readonly sponges = inject(SpongeRecipeRepository);
    private readonly fillings = inject(FillingRecipeRepository);
    private readonly coverings = inject(CoveringRecipeRepository);
    private readonly toppers = inject(TopperRepository);
    private readonly packagingItems = inject(PackagingItemRepository);
    private readonly ingredients = inject(IngredientRepository);
    private readonly scaling = inject(CakeScalingService);
    private readonly builder = inject(ShoppingListBuilder);
    private readonly bus = inject(EventBus);

    async execute({ compositionId }: GenerateShoppingListRequest): Promise<ShoppingList> {
        const composition = await this.compositions.byId(new EntityId(compositionId));
        if (!composition) {
            throw new Error(`Cake composition ${compositionId} does not exist`);
        }

        const sponge = await this.sponges.byId(composition.spongeRecipeId);
        const filling = await this.fillings.byId(composition.fillingRecipeId);
        const covering = await this.coverings.byId(composition.coveringRecipeId);
        const box = await this.packagingItems.byId(composition.suggestedBoxId);
        const base = await this.packagingItems.byId(composition.suggestedBaseId);
        if (!sponge || !filling || !covering || !box || !base) {
            throw new Error('Composition is incomplete: a referenced recipe or packaging item is missing');
        }

        const scaled = this.scaling.scale({ composition, sponge, filling, covering });
        const ingredients = await this.loadIngredients(scaled.map((s) => s.ingredientId));
        const topper = composition.topperId ? await this.toppers.byId(composition.topperId) : undefined;

        const list = this.builder.build({ scaled, ingredients, box, base, topper: topper ?? undefined });
        await this.bus.publish([RecipeBookEvents.shoppingListGenerated(compositionId, list.items.length)]);
        return list;
    }

    private async loadIngredients(ids: EntityId[]): Promise<Ingredient[]> {
        const loaded = await Promise.all(ids.map((id) => this.ingredients.byId(id)));
        return loaded.filter((i): i is Ingredient => i !== null);
    }
}
