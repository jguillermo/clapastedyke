import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { Ingredient } from '../../domain/entities/ingredient';
import { SpongeRecipe } from '../../domain/entities/sponge-recipe';
import { FillingRecipe } from '../../domain/entities/filling-recipe';
import { CoveringRecipe } from '../../domain/entities/covering-recipe';
import { PackagingRule } from '../../domain/entities/packaging-rule';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { SpongeRecipeRepository } from '../../domain/repositories/sponge-recipe.repository';
import { FillingRecipeRepository } from '../../domain/repositories/filling-recipe.repository';
import { CoveringRecipeRepository } from '../../domain/repositories/covering-recipe.repository';
import { PackagingRuleRepository } from '../../domain/repositories/packaging-rule.repository';

/**
 * The recipe-book catalog. Everything bought is an `Ingredient` (told apart by
 * `usage`), so topper/box/base live inside `ingredients` — there are no
 * separate topper/packaging lists.
 */
export interface RecipeBookCatalog {
    ingredients: Ingredient[];
    sponges: SpongeRecipe[];
    fillings: FillingRecipe[];
    coverings: CoveringRecipe[];
    packagingRules: PackagingRule[];
}

/** Reads the whole catalog. Pure query — emits no event. */
@Injectable({ providedIn: 'root' })
export class ListRecipeBook extends UseCase<void, RecipeBookCatalog> {
    private readonly ingredients = inject(IngredientRepository);
    private readonly sponges = inject(SpongeRecipeRepository);
    private readonly fillings = inject(FillingRecipeRepository);
    private readonly coverings = inject(CoveringRecipeRepository);
    private readonly packagingRules = inject(PackagingRuleRepository);

    async execute(): Promise<RecipeBookCatalog> {
        const [ingredients, sponges, fillings, coverings, packagingRules] = await Promise.all([
            this.ingredients.all(),
            this.sponges.all(),
            this.fillings.all(),
            this.coverings.all(),
            this.packagingRules.all(),
        ]);
        return { ingredients, sponges, fillings, coverings, packagingRules };
    }
}
