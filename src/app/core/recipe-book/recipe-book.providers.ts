import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { SupplyRepository } from './domain/repositories/supply.repository';
import { RecipeRepository } from './domain/repositories/recipe.repository';
import { RecipeCategoryRepository } from './domain/repositories/recipe-category.repository';
import { FlavorRepository } from './domain/repositories/flavor.repository';
import { RecipeCapacityRepository } from './domain/repositories/recipe-capacity.repository';
import { IndexedDbSupplyRepository } from './infrastructure/indexeddb-supply.repository';
import { IndexedDbRecipeRepository } from './infrastructure/indexeddb-recipe.repository';
import { IndexedDbRecipeCategoryRepository } from './infrastructure/indexeddb-recipe-category.repository';
import { IndexedDbFlavorRepository } from './infrastructure/indexeddb-flavor.repository';
import { IndexedDbRecipeCapacityRepository } from './infrastructure/indexeddb-recipe-capacity.repository';
import { RecipeBookSeed } from './infrastructure/recipe-book-seed';
import { SeedDataSource, HttpSeedDataSource } from './infrastructure/seed-data-source';
import { SeedState } from './infrastructure/seed-state';
import { IndexedDbSeedState } from './infrastructure/indexeddb-seed-state';

/**
 * DI del contexto recipe-book: enlaza cada puerto de repositorio (abstracto) con
 * su implementación IndexedDB y las fuentes de seed. Además registra un
 * app-initializer que siembra las categorías de sistema y el catálogo en BD vacía
 * (`RecipeBookSeed.run()`). Se agrega en `app.config.ts` vía `provideRecipeBook()`.
 */
export function provideRecipeBook(): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: SupplyRepository, useClass: IndexedDbSupplyRepository },
        { provide: RecipeRepository, useClass: IndexedDbRecipeRepository },
        { provide: RecipeCategoryRepository, useClass: IndexedDbRecipeCategoryRepository },
        { provide: FlavorRepository, useClass: IndexedDbFlavorRepository },
        { provide: RecipeCapacityRepository, useClass: IndexedDbRecipeCapacityRepository },
        { provide: SeedDataSource, useClass: HttpSeedDataSource },
        { provide: SeedState, useClass: IndexedDbSeedState },
        provideAppInitializer(() => inject(RecipeBookSeed).run()),
    ]);
}
