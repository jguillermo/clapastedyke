import { EntityId, ID_PREFIXES, IdGenerator } from '../../_common/domain/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
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
 * Catalog IndexedDB adapters: the ONLY persistence implementation of the web
 * app (the browser database). They serialize the aggregate to primitives and
 * rehydrate it with its factories; the domain never sees IndexedDB.
 */

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export class IndexedDbCustomerRepository implements CustomerRepository {
  private readonly store = new IndexedDbStore<CustomerPrimitives>('customers');
  constructor(private readonly ids: IdGenerator) {}

  nextId() {
    return this.ids.next(ID_PREFIXES.customer);
  }
  async byId(id: EntityId) {
    const doc = await this.store.get(id.value);
    return doc ? Customer.fromPrimitives(doc) : null;
  }
  async byName(name: string) {
    const docs = await this.store.all();
    const doc = docs.find(d => sameName(d.name, name));
    return doc ? Customer.fromPrimitives(doc) : null;
  }
  async save(customer: Customer) {
    await this.store.put(customer.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(Customer.fromPrimitives);
  }
}

export class IndexedDbSupplierRepository implements SupplierRepository {
  private readonly store = new IndexedDbStore<SupplierPrimitives>('suppliers');
  constructor(private readonly ids: IdGenerator) {}

  nextId() {
    return this.ids.next(ID_PREFIXES.supplier);
  }
  async byId(id: EntityId) {
    const doc = await this.store.get(id.value);
    return doc ? Supplier.fromPrimitives(doc) : null;
  }
  async byName(name: string) {
    const docs = await this.store.all();
    const doc = docs.find(d => sameName(d.name, name));
    return doc ? Supplier.fromPrimitives(doc) : null;
  }
  async save(supplier: Supplier) {
    await this.store.put(supplier.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(Supplier.fromPrimitives);
  }
}

export class IndexedDbSupplyRepository implements SupplyRepository {
  private readonly store = new IndexedDbStore<SupplyPrimitives>('supplies');
  constructor(private readonly ids: IdGenerator) {}

  nextId() {
    return this.ids.next(ID_PREFIXES.supply);
  }
  async byId(id: EntityId) {
    const doc = await this.store.get(id.value);
    return doc ? Supply.fromPrimitives(doc) : null;
  }
  async byName(name: string) {
    const docs = await this.store.all();
    const doc = docs.find(d => sameName(d.name, name));
    return doc ? Supply.fromPrimitives(doc) : null;
  }
  async save(supply: Supply) {
    await this.store.put(supply.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(Supply.fromPrimitives);
  }
  async byType(type: SupplyType) {
    return (await this.store.all()).filter(d => d.type === type).map(Supply.fromPrimitives);
  }
}

export class IndexedDbRecipeRepository implements RecipeRepository {
  private readonly store = new IndexedDbStore<RecipePrimitives>('recipes');
  constructor(private readonly ids: IdGenerator) {}

  nextId() {
    return this.ids.next(ID_PREFIXES.recipe);
  }
  async byId(id: EntityId) {
    const doc = await this.store.get(id.value);
    return doc ? Recipe.fromPrimitives(doc) : null;
  }
  async byName(name: string) {
    const docs = await this.store.all();
    const doc = docs.find(d => sameName(d.name, name));
    return doc ? Recipe.fromPrimitives(doc) : null;
  }
  async save(recipe: Recipe) {
    await this.store.put(recipe.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(Recipe.fromPrimitives);
  }
}

export class IndexedDbPackagingRuleRepository implements PackagingRuleRepository {
  private readonly store = new IndexedDbStore<PackagingRulePrimitives>('packaging_rules');
  constructor(private readonly ids: IdGenerator) {}

  nextId() {
    return this.ids.next(ID_PREFIXES.packagingRule);
  }
  async byId(id: EntityId) {
    const doc = await this.store.get(id.value);
    return doc ? PackagingRule.fromPrimitives(doc) : null;
  }
  async save(rule: PackagingRule) {
    await this.store.put(rule.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(PackagingRule.fromPrimitives);
  }
  async byRecipeAndSize(recipeId: EntityId, size: string) {
    const clean = size.trim().toLowerCase();
    return (await this.store.all())
      .filter(d => d.recipeId === recipeId.value && d.size === clean)
      .map(PackagingRule.fromPrimitives);
  }
}
