import { Injectable, inject } from '@angular/core';
import { IdGeneratorToken, EventBusToken } from '../_common/core.tokens';
import { SettingsService } from '../settings/settings.service';
import {
  IndexedDbCustomerRepository,
  IndexedDbSupplierRepository,
  IndexedDbSupplyRepository,
  IndexedDbRecipeRepository,
  IndexedDbPackagingRuleRepository,
} from './infrastructure/indexeddb-repositories';
import { SizesFromSettings } from '../settings/infrastructure/indexeddb-settings-repository';
import { SaveCustomer } from './application/save-customer/save-customer';
import { ListCustomers } from './application/list-customers/list-customers';
import { SaveSupplier } from './application/save-supplier/save-supplier';
import { ListSuppliers } from './application/list-suppliers/list-suppliers';
import { SaveSupply } from './application/save-supply/save-supply';
import { ListSupplies } from './application/list-supplies/list-supplies';
import { SaveRecipe } from './application/save-recipe/save-recipe';
import { ListRecipes } from './application/list-recipes/list-recipes';
import { SavePackagingRule } from './application/save-packaging-rule/save-packaging-rule';
import { ListPackagingRules } from './application/list-packaging-rules/list-packaging-rules';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly ids = inject(IdGeneratorToken);
  private readonly bus = inject(EventBusToken);
  private readonly settings = inject(SettingsService);

  // Repositories exposed for cross-context wiring
  readonly customerRepo = new IndexedDbCustomerRepository(this.ids);
  readonly supplierRepo = new IndexedDbSupplierRepository(this.ids);
  readonly supplyRepo = new IndexedDbSupplyRepository(this.ids);
  readonly recipeRepo = new IndexedDbRecipeRepository(this.ids);
  readonly packagingRuleRepo = new IndexedDbPackagingRuleRepository(this.ids);

  private readonly availableSizes = new SizesFromSettings(this.settings.settingsRepo);

  readonly saveCustomer = new SaveCustomer(this.customerRepo, this.bus);
  readonly listCustomers = new ListCustomers(this.customerRepo);
  readonly saveSupplier = new SaveSupplier(this.supplierRepo, this.bus);
  readonly listSuppliers = new ListSuppliers(this.supplierRepo);
  readonly saveSupply = new SaveSupply(this.supplyRepo, this.bus);
  readonly listSupplies = new ListSupplies(this.supplyRepo);
  readonly saveRecipe = new SaveRecipe(this.recipeRepo, this.supplyRepo, this.bus);
  readonly listRecipes = new ListRecipes(this.recipeRepo);
  readonly savePackagingRule = new SavePackagingRule(
    this.packagingRuleRepo, this.recipeRepo, this.supplyRepo, this.availableSizes, this.bus,
  );
  readonly listPackagingRules = new ListPackagingRules(this.packagingRuleRepo);
}
