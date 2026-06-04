import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { IdGeneratorToken } from '../_common/core.tokens';
import { CUSTOMER_REPOSITORY } from './domain/customer/customer-repository';
import { SUPPLIER_REPOSITORY } from './domain/supplier/supplier-repository';
import { SUPPLY_REPOSITORY } from './domain/supply/supply-repository';
import { RECIPE_REPOSITORY } from './domain/recipe/recipe-repository';
import { AVAILABLE_SIZES_TOKEN, PACKAGING_RULE_REPOSITORY } from './domain/packaging-rule/packaging-rule-repository';
import {
  IndexedDbCustomerRepository,
  IndexedDbPackagingRuleRepository,
  IndexedDbRecipeRepository,
  IndexedDbSupplierRepository,
  IndexedDbSupplyRepository,
} from './infrastructure/indexeddb-repositories';
import { SizesFromSettings } from './infrastructure/sizes-from-settings';
import { SETTINGS_REPOSITORY } from '../settings/domain/settings-repository';

export function provideCatalog(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CUSTOMER_REPOSITORY, useFactory: () => new IndexedDbCustomerRepository(inject(IdGeneratorToken)) },
    { provide: SUPPLIER_REPOSITORY, useFactory: () => new IndexedDbSupplierRepository(inject(IdGeneratorToken)) },
    { provide: SUPPLY_REPOSITORY, useFactory: () => new IndexedDbSupplyRepository(inject(IdGeneratorToken)) },
    { provide: RECIPE_REPOSITORY, useFactory: () => new IndexedDbRecipeRepository(inject(IdGeneratorToken)) },
    { provide: PACKAGING_RULE_REPOSITORY, useFactory: () => new IndexedDbPackagingRuleRepository(inject(IdGeneratorToken)) },
    { provide: AVAILABLE_SIZES_TOKEN, useFactory: () => new SizesFromSettings(inject(SETTINGS_REPOSITORY)) },
  ]);
}
