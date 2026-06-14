import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { IngredientRepository } from './domain/repositories/ingredient.repository';
import { SpongeRecipeRepository } from './domain/repositories/sponge-recipe.repository';
import { FillingRecipeRepository } from './domain/repositories/filling-recipe.repository';
import { CoveringRecipeRepository } from './domain/repositories/covering-recipe.repository';
import { PackagingRuleRepository } from './domain/repositories/packaging-rule.repository';
import { CakeCompositionRepository } from './domain/repositories/cake-composition.repository';
import { IngredientPriceHistoryRepository } from './domain/repositories/ingredient-price-history.repository';
import { IndexedDbIngredientRepository } from './infrastructure/indexeddb-ingredient.repository';
import { IndexedDbSpongeRecipeRepository } from './infrastructure/indexeddb-sponge-recipe.repository';
import { IndexedDbFillingRecipeRepository } from './infrastructure/indexeddb-filling-recipe.repository';
import { IndexedDbCoveringRecipeRepository } from './infrastructure/indexeddb-covering-recipe.repository';
import { IndexedDbPackagingRuleRepository } from './infrastructure/indexeddb-packaging-rule.repository';
import { IndexedDbCakeCompositionRepository } from './infrastructure/indexeddb-cake-composition.repository';
import { IndexedDbIngredientPriceHistoryRepository } from './infrastructure/indexeddb-ingredient-price-history.repository';
import { IngredientPriceRecorder } from './infrastructure/ingredient-price-recorder.subscriber';

/**
 * Binds each recipe-book aggregate repository to its IndexedDB implementation,
 * the append-only price-history store, and activates the (invisible) price
 * recorder subscriber at startup.
 */
export function provideRecipeBook(): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: IngredientRepository, useClass: IndexedDbIngredientRepository },
        { provide: SpongeRecipeRepository, useClass: IndexedDbSpongeRecipeRepository },
        { provide: FillingRecipeRepository, useClass: IndexedDbFillingRecipeRepository },
        { provide: CoveringRecipeRepository, useClass: IndexedDbCoveringRecipeRepository },
        { provide: PackagingRuleRepository, useClass: IndexedDbPackagingRuleRepository },
        { provide: CakeCompositionRepository, useClass: IndexedDbCakeCompositionRepository },
        { provide: IngredientPriceHistoryRepository, useClass: IndexedDbIngredientPriceHistoryRepository },
        provideAppInitializer(() => inject(IngredientPriceRecorder).register()),
    ]);
}
