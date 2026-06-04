import { EntityId, ID_PREFIXES, IdGenerator, IdPrefix } from '../../_common/domain/entity-id';
import { MemoryIdGenerator, MemoryStore } from '../../_common/infrastructure/memory/memory-store';
import { Customer, CustomerPrimitives } from '../domain/customer/customer';
import { CustomerRepository } from '../domain/customer/customer-repository';
import { Supply, SupplyPrimitives, SupplyType } from '../domain/supply/supply';
import { SupplyRepository } from '../domain/supply/supply-repository';
import { Supplier, SupplierPrimitives } from '../domain/supplier/supplier';
import { SupplierRepository } from '../domain/supplier/supplier-repository';
import { Recipe, RecipePrimitives } from '../domain/recipe/recipe';
import { RecipeRepository } from '../domain/recipe/recipe-repository';
import { PackagingRule, PackagingRulePrimitives } from '../domain/packaging-rule/packaging-rule';
import { PackagingRuleRepository } from '../domain/packaging-rule/packaging-rule-repository';

/**
 * Catalog in-memory repositories: doubles for use-case tests, with the same
 * contract as the IndexedDB adapters.
 */

abstract class MemoryRepositoryBase<
  A extends { toPrimitives(): P },
  P extends { id: string; name?: string },
> {
  protected readonly store = new MemoryStore<P>();
  constructor(
    protected readonly ids: IdGenerator,
    private readonly prefix: IdPrefix,
    private readonly rehydrate: (p: P) => A,
  ) {}

  nextId() {
    return this.ids.next(this.prefix);
  }
  async byId(id: EntityId) {
    const doc = await this.store.get(id.value);
    return doc ? this.rehydrate(doc) : null;
  }
  async byName(name: string) {
    const docs = await this.store.all();
    const wanted = name.trim().toLowerCase();
    const doc = docs.find(d => (d.name ?? '').trim().toLowerCase() === wanted);
    return doc ? this.rehydrate(doc) : null;
  }
  async save(aggregate: A) {
    await this.store.put(aggregate.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(this.rehydrate);
  }
}

export class MemoryCustomerRepository
  extends MemoryRepositoryBase<Customer, CustomerPrimitives>
  implements CustomerRepository
{
  constructor(ids: IdGenerator = new MemoryIdGenerator()) {
    super(ids, ID_PREFIXES.customer, Customer.fromPrimitives);
  }
}

export class MemorySupplierRepository
  extends MemoryRepositoryBase<Supplier, SupplierPrimitives>
  implements SupplierRepository
{
  constructor(ids: IdGenerator = new MemoryIdGenerator()) {
    super(ids, ID_PREFIXES.supplier, Supplier.fromPrimitives);
  }
}

export class MemorySupplyRepository
  extends MemoryRepositoryBase<Supply, SupplyPrimitives>
  implements SupplyRepository
{
  constructor(ids: IdGenerator = new MemoryIdGenerator()) {
    super(ids, ID_PREFIXES.supply, Supply.fromPrimitives);
  }
  async byType(type: SupplyType) {
    return (await this.all()).filter(s => s.type === type);
  }
}

export class MemoryRecipeRepository
  extends MemoryRepositoryBase<Recipe, RecipePrimitives>
  implements RecipeRepository
{
  constructor(ids: IdGenerator = new MemoryIdGenerator()) {
    super(ids, ID_PREFIXES.recipe, Recipe.fromPrimitives);
  }
}

export class MemoryPackagingRuleRepository
  extends MemoryRepositoryBase<PackagingRule, PackagingRulePrimitives>
  implements PackagingRuleRepository
{
  constructor(ids: IdGenerator = new MemoryIdGenerator()) {
    super(ids, ID_PREFIXES.packagingRule, PackagingRule.fromPrimitives);
  }
  async byRecipeAndSize(recipeId: EntityId, size: string) {
    const clean = size.trim().toLowerCase();
    return (await this.all()).filter(
      r => r.recipeId.equals(recipeId) && r.size === clean,
    );
  }
}
