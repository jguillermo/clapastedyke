import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { IngredientRepository } from './domain/repositories/ingredient.repository';
import { RecipeRepository } from './domain/repositories/recipe.repository';
import { RecipeCategoryRepository } from './domain/repositories/recipe-category.repository';
import { PackagingRuleRepository } from './domain/repositories/packaging-rule.repository';
import { CakeCompositionRepository } from './domain/repositories/cake-composition.repository';
import { IngredientPriceHistoryRepository } from './domain/repositories/ingredient-price-history.repository';
import { FlavorRepository } from './domain/repositories/flavor.repository';
import { ConversionOptionRepository } from './domain/repositories/conversion-option.repository';
import { RecipeSelectionRepository } from './domain/repositories/recipe-selection.repository';
import { IndexedDbIngredientRepository } from './infrastructure/indexeddb-ingredient.repository';
import { IndexedDbRecipeRepository } from './infrastructure/indexeddb-recipe.repository';
import { IndexedDbRecipeCategoryRepository } from './infrastructure/indexeddb-recipe-category.repository';
import { IndexedDbPackagingRuleRepository } from './infrastructure/indexeddb-packaging-rule.repository';
import { IndexedDbCakeCompositionRepository } from './infrastructure/indexeddb-cake-composition.repository';
import { IndexedDbIngredientPriceHistoryRepository } from './infrastructure/indexeddb-ingredient-price-history.repository';
import { IndexedDbFlavorRepository } from './infrastructure/indexeddb-flavor.repository';
import { IndexedDbConversionOptionRepository } from './infrastructure/indexeddb-conversion-option.repository';
import { IndexedDbRecipeSelectionRepository } from './infrastructure/indexeddb-recipe-selection.repository';
import { IngredientPriceRecorder } from './infrastructure/ingredient-price-recorder.subscriber';
import { RecipeBookSeed } from './infrastructure/recipe-book-seed';

/**
 * Binds each recipe-book aggregate repository to its IndexedDB implementation,
 * the append-only price-history store, siembra las categorías de sistema en BD
 * vacía, y activa el (invisible) price recorder al iniciar.
 */
export function provideRecipeBook(): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: IngredientRepository, useClass: IndexedDbIngredientRepository },
        { provide: RecipeRepository, useClass: IndexedDbRecipeRepository },
        { provide: RecipeCategoryRepository, useClass: IndexedDbRecipeCategoryRepository },
        { provide: PackagingRuleRepository, useClass: IndexedDbPackagingRuleRepository },
        { provide: CakeCompositionRepository, useClass: IndexedDbCakeCompositionRepository },
        { provide: IngredientPriceHistoryRepository, useClass: IndexedDbIngredientPriceHistoryRepository },
        { provide: FlavorRepository, useClass: IndexedDbFlavorRepository },
        { provide: ConversionOptionRepository, useClass: IndexedDbConversionOptionRepository },
        { provide: RecipeSelectionRepository, useClass: IndexedDbRecipeSelectionRepository },
        provideAppInitializer(() => inject(RecipeBookSeed).run()),
        provideAppInitializer(() => inject(IngredientPriceRecorder).register()),
    ]);
}
