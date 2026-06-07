import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { Ingredient } from '../../domain/entities/ingredient';
import { SpongeRecipe } from '../../domain/entities/sponge-recipe';
import { FillingRecipe } from '../../domain/entities/filling-recipe';
import { CoveringRecipe } from '../../domain/entities/covering-recipe';
import { Topper } from '../../domain/entities/topper';
import { PackagingItem } from '../../domain/entities/packaging-item';
import { PackagingRule } from '../../domain/entities/packaging-rule';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { SpongeRecipeRepository } from '../../domain/repositories/sponge-recipe.repository';
import { FillingRecipeRepository } from '../../domain/repositories/filling-recipe.repository';
import { CoveringRecipeRepository } from '../../domain/repositories/covering-recipe.repository';
import { TopperRepository } from '../../domain/repositories/topper.repository';
import { PackagingItemRepository } from '../../domain/repositories/packaging-item.repository';
import { PackagingRuleRepository } from '../../domain/repositories/packaging-rule.repository';

/** The recipe-book catalog grouped by type, for the "Mi libro de recetas" view. */
export interface RecipeBookCatalog {
    ingredients: Ingredient[];
    sponges: SpongeRecipe[];
    fillings: FillingRecipe[];
    coverings: CoveringRecipe[];
    toppers: Topper[];
    packagingItems: PackagingItem[];
    packagingRules: PackagingRule[];
}

/** Reads the whole catalog grouped by type. Pure query — emits no event. */
@Injectable({ providedIn: 'root' })
export class ListRecipeBook extends UseCase<void, RecipeBookCatalog> {
    private readonly ingredients = inject(IngredientRepository);
    private readonly sponges = inject(SpongeRecipeRepository);
    private readonly fillings = inject(FillingRecipeRepository);
    private readonly coverings = inject(CoveringRecipeRepository);
    private readonly toppers = inject(TopperRepository);
    private readonly packagingItems = inject(PackagingItemRepository);
    private readonly packagingRules = inject(PackagingRuleRepository);

    async execute(): Promise<RecipeBookCatalog> {
        const [ingredients, sponges, fillings, coverings, toppers, packagingItems, packagingRules] = await Promise.all([
            this.ingredients.all(),
            this.sponges.all(),
            this.fillings.all(),
            this.coverings.all(),
            this.toppers.all(),
            this.packagingItems.all(),
            this.packagingRules.all(),
        ]);
        return { ingredients, sponges, fillings, coverings, toppers, packagingItems, packagingRules };
    }
}
