import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { Ingredient } from '../../domain/entities/ingredient';
import { Recipe } from '../../domain/entities/recipe';
import { RecipeCategory } from '../../domain/entities/recipe-category';
import { PackagingRule } from '../../domain/entities/packaging-rule';
import { Flavor } from '../../domain/entities/flavor';
import { ConversionOption } from '../../domain/entities/conversion-option';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { RecipeCategoryRepository } from '../../domain/repositories/recipe-category.repository';
import { PackagingRuleRepository } from '../../domain/repositories/packaging-rule.repository';
import { FlavorRepository } from '../../domain/repositories/flavor.repository';
import { ConversionOptionRepository } from '../../domain/repositories/conversion-option.repository';

/**
 * El catálogo del recetario. Las recetas se agrupan por `recipe.categoryId`; las
 * categorías vienen ordenadas por `order` (las de sistema primero, las nuevas al
 * final). Todo lo que se compra es un `Ingredient` (separado, nunca en el índice).
 */
export interface RecipeBookCatalog {
    ingredients: Ingredient[];
    categories: RecipeCategory[];
    recipes: Recipe[];
    packagingRules: PackagingRule[];
    flavors: Flavor[];
    conversionOptions: ConversionOption[];
}

/** Reads the whole catalog. Pure query — emits no event. */
@Injectable({ providedIn: 'root' })
export class ListRecipeBook extends UseCase<void, RecipeBookCatalog> {
    private readonly ingredients = inject(IngredientRepository);
    private readonly recipes = inject(RecipeRepository);
    private readonly categories = inject(RecipeCategoryRepository);
    private readonly packagingRules = inject(PackagingRuleRepository);
    private readonly flavors = inject(FlavorRepository);
    private readonly conversionOptions = inject(ConversionOptionRepository);

    async execute(): Promise<RecipeBookCatalog> {
        const [ingredients, categories, recipes, packagingRules, flavors, conversionOptions] =
            await Promise.all([
                this.ingredients.all(),
                this.categories.all(),
                this.recipes.all(),
                this.packagingRules.all(),
                this.flavors.all(),
                this.conversionOptions.all(),
            ]);
        categories.sort((a, b) => a.order - b.order);
        return { ingredients, categories, recipes, packagingRules, flavors, conversionOptions };
    }
}
