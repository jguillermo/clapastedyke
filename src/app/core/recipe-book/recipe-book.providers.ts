import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { IngredientRepository } from './domain/repositories/ingredient.repository';
import { SpongeRecipeRepository } from './domain/repositories/sponge-recipe.repository';
import { FillingRecipeRepository } from './domain/repositories/filling-recipe.repository';
import { CoveringRecipeRepository } from './domain/repositories/covering-recipe.repository';
import { TopperRepository } from './domain/repositories/topper.repository';
import { PackagingItemRepository } from './domain/repositories/packaging-item.repository';
import { PackagingRuleRepository } from './domain/repositories/packaging-rule.repository';
import { CakeCompositionRepository } from './domain/repositories/cake-composition.repository';
import { IndexedDbIngredientRepository } from './infrastructure/indexeddb-ingredient.repository';
import { IndexedDbSpongeRecipeRepository } from './infrastructure/indexeddb-sponge-recipe.repository';
import { IndexedDbFillingRecipeRepository } from './infrastructure/indexeddb-filling-recipe.repository';
import { IndexedDbCoveringRecipeRepository } from './infrastructure/indexeddb-covering-recipe.repository';
import { IndexedDbTopperRepository } from './infrastructure/indexeddb-topper.repository';
import { IndexedDbPackagingItemRepository } from './infrastructure/indexeddb-packaging-item.repository';
import { IndexedDbPackagingRuleRepository } from './infrastructure/indexeddb-packaging-rule.repository';
import { IndexedDbCakeCompositionRepository } from './infrastructure/indexeddb-cake-composition.repository';

/** Binds each recipe-book aggregate repository to its IndexedDB implementation. */
export function provideRecipeBook(): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: IngredientRepository, useClass: IndexedDbIngredientRepository },
        { provide: SpongeRecipeRepository, useClass: IndexedDbSpongeRecipeRepository },
        { provide: FillingRecipeRepository, useClass: IndexedDbFillingRecipeRepository },
        { provide: CoveringRecipeRepository, useClass: IndexedDbCoveringRecipeRepository },
        { provide: TopperRepository, useClass: IndexedDbTopperRepository },
        { provide: PackagingItemRepository, useClass: IndexedDbPackagingItemRepository },
        { provide: PackagingRuleRepository, useClass: IndexedDbPackagingRuleRepository },
        { provide: CakeCompositionRepository, useClass: IndexedDbCakeCompositionRepository },
    ]);
}
