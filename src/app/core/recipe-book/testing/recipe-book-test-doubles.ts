/**
 * Dobles de test compartidos del contexto `recipe-book`: repositorios in-memory de cada
 * agregado, un event bus de grabación (`RecordingEventBus`), dobles del sembrado
 * (`FakeSeedDataSource`/`FakeSeedState`) y builders de datos falsos (seeds) para armar
 * escenarios rápidamente.
 *
 * Lo usan todos los specs del contexto: cada spec obtiene los providers de Angular vía
 * `makeRecipeBookFakes().providers` y los inyecta en el TestBed, de modo que los casos de
 * uso corren contra estas implementaciones en memoria en lugar de IndexedDB.
 */
import { Provider } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { BaseUnit, Quantity } from '../../_common/quantity';
import { DomainEvent } from '../../_common/eventbus/domain-event';
import { EventBus, EventHandler } from '../../_common/eventbus/event-bus';
import { Supply } from '../domain/entities/supply';
import { Recipe } from '../domain/entities/recipe';
import { RecipeCategory } from '../domain/entities/recipe-category';
import { RecipeFlavor } from '../domain/entities/recipe-flavor';
import { CapacityGroup, RecipeCapacity } from '../domain/entities/recipe-capacity';
import { PurchasePrice } from '../domain/value-objects/purchase-price';
import { SupplyUsage } from '../domain/value-objects/supply-usage';
import { RecipeIngredient } from '../domain/value-objects/recipe-ingredient';
import { SupplyRepository } from '../domain/repositories/supply.repository';
import { RecipeRepository } from '../domain/repositories/recipe.repository';
import { RecipeCategoryRepository } from '../domain/repositories/recipe-category.repository';
import { RecipeFlavorRepository } from '../domain/repositories/recipe-flavor.repository';
import { RecipeCapacityRepository } from '../domain/repositories/recipe-capacity.repository';
import { SeedDataSource } from '../infrastructure/seed/seed-data-source';
import { SeedState } from '../infrastructure/seed/seed-state';
import { ConsoleLogger } from '../../_common/logger/console-logger';
import { Logger } from '../../_common/logger/logger';
import { RecipeBookSeedDocument } from '../infrastructure/seed/recipe-book-seed-document';

/** Almacén in-memory compartido que respalda los repositorios falsos. */
class Store<T extends { id: EntityId }> {
  readonly items = new Map<string, T>();
  private seq = 0;

  constructor(private readonly prefix: string) {}

  next(): EntityId {
    return new EntityId(`${this.prefix}-${++this.seq}`);
  }

  byId(id: EntityId): T | null {
    return this.items.get(id.value) ?? null;
  }

  byName(name: string, nameOf: (item: T) => string): T | null {
    const target = name.trim().toLowerCase();
    return [...this.items.values()].find((item) => nameOf(item).toLowerCase() === target) ?? null;
  }

  save(aggregate: T): void {
    this.items.set(aggregate.id.value, aggregate);
  }

  all(): T[] {
    return [...this.items.values()];
  }
}

class InMemorySupplyRepository extends SupplyRepository {
  private readonly store = new Store<Supply>('SU');
  nextIdentity = () => this.store.next();
  byId = async (id: EntityId) => this.store.byId(id);
  byName = async (name: string) => this.store.byName(name, (s) => s.name);
  save = async (s: Supply) => this.store.save(s);
  all = async () => this.store.all();
}

class InMemoryRecipeCategoryRepository extends RecipeCategoryRepository {
  private readonly store = new Store<RecipeCategory>('CAT');
  nextIdentity = () => this.store.next();
  byId = async (id: EntityId) => this.store.byId(id);
  byName = async (name: string) => this.store.byName(name, (c) => c.name);
  save = async (c: RecipeCategory) => this.store.save(c);
  all = async () => this.store.all();
}

class InMemoryRecipeRepository extends RecipeRepository {
  private readonly store = new Store<Recipe>('RE');
  nextIdentity = () => this.store.next();
  byId = async (id: EntityId) => this.store.byId(id);
  byNameInCategory = async (categoryId: EntityId, name: string) => {
    const target = name.trim().toLowerCase();
    return (
      this.store
        .all()
        .find((r) => r.categoryId.equals(categoryId) && r.name.toLowerCase() === target) ?? null
    );
  };
  byCategory = async (categoryId: EntityId) =>
    this.store.all().filter((r) => r.categoryId.equals(categoryId));
  save = async (r: Recipe) => this.store.save(r);
  all = async () => this.store.all();
}

class InMemoryRecipeFlavorRepository extends RecipeFlavorRepository {
  private readonly store = new Store<RecipeFlavor>('FL');
  nextIdentity = () => this.store.next();
  byId = async (id: EntityId) => this.store.byId(id);
  save = async (f: RecipeFlavor) => this.store.save(f);
  all = async () => this.store.all();
  delete = async (id: EntityId) => {
    this.store.items.delete(id.value);
  };
}

class InMemoryRecipeCapacityRepository extends RecipeCapacityRepository {
  private readonly store = new Store<RecipeCapacity>('RC');
  nextIdentity = () => this.store.next();
  byId = async (id: EntityId) => this.store.byId(id);
  byGroup = async (group: CapacityGroup) => this.store.all().filter((c) => c.group === group);
  save = async (c: RecipeCapacity) => this.store.save(c);
  all = async () => this.store.all();
  delete = async (id: EntityId) => {
    this.store.items.delete(id.value);
  };
}

/** Doble de EventBus que graba todo lo publicado para poder hacer aserciones. */
export class RecordingEventBus extends EventBus {
  readonly published: DomainEvent[] = [];
  async publish(events: readonly DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }
  subscribe(_subscriber: string, _eventName: string, _handler: EventHandler): void {
    // no hace nada en los tests
  }
  names(): string[] {
    return this.published.map((e) => e.name);
  }
}

/** Bindings de los repositorios de agregados a los dobles in-memory (sin EventBus). */
export const recipeBookRepositoryProviders: Provider[] = [
  // El seed registra avisos; sin logger el TestBed no puede ni construirlo.
  { provide: Logger, useClass: ConsoleLogger },
  { provide: SupplyRepository, useClass: InMemorySupplyRepository },
  { provide: RecipeRepository, useClass: InMemoryRecipeRepository },
  { provide: RecipeCategoryRepository, useClass: InMemoryRecipeCategoryRepository },
  { provide: RecipeFlavorRepository, useClass: InMemoryRecipeFlavorRepository },
  { provide: RecipeCapacityRepository, useClass: InMemoryRecipeCapacityRepository },
];

/** Doble de SeedDataSource: devuelve un documento (mutable), o `null` para "sin archivo de sembrado". */
export class FakeSeedDataSource extends SeedDataSource {
  constructor(public doc: RecipeBookSeedDocument | null = null) {
    super();
  }
  load = async () => this.doc;
}

/** Doble in-memory de SeedState: recuerda la versión aplicada por cada clave. */
export class FakeSeedState extends SeedState {
  private readonly versions = new Map<string, number>();
  appliedVersion = async (key: string) => this.versions.get(key) ?? null;
  markApplied = async (key: string, version: number) => {
    this.versions.set(key, version);
  };
}

export interface RecipeBookFakes {
  bus: RecordingEventBus;
  /** El doble de SeedDataSource; muta `.doc` para cambiar el sembrado entre corridas. */
  seedSource: FakeSeedDataSource;
  providers: Provider[];
}

/**
 * Construye dobles in-memory nuevos y los providers de Angular correspondientes. `seedDoc`
 * respalda el {@link SeedDataSource} (por defecto `null` → el sembrado no carga contenido).
 */
export function makeRecipeBookFakes(
  seedDoc: RecipeBookSeedDocument | null = null,
): RecipeBookFakes {
  const bus = new RecordingEventBus();
  const seedSource = new FakeSeedDataSource(seedDoc);
  const providers: Provider[] = [
    ...recipeBookRepositoryProviders,
    { provide: EventBus, useValue: bus },
    { provide: SeedDataSource, useValue: seedSource },
    { provide: SeedState, useClass: FakeSeedState },
  ];
  return { bus, seedSource, providers };
}

/** Helper de test: un literal de petición de precio de compra para SaveSupply. */
export function aPurchase(
  unit: BaseUnit = 'g',
  amount = 5,
): { amount: number; per: { value: number; unit: BaseUnit } } {
  return { amount, per: { value: unit === 'u' ? 10 : 1000, unit } };
}

/**
 * Los builders montan el estado de partida de un test, y montar el escenario no es guardar: todos
 * usan **`restore`** para no grabar eventos. Con `create` cada fixture dejaría un `*Saved` en la cola
 * y los asertos sobre lo que publica el caso de uso saldrían contaminados.
 */
/** Test helper: una categoría de catálogo (id + nombre). */
export function makeCategory(id: string, name: string): RecipeCategory {
  return RecipeCategory.restore({ id: new EntityId(id), name });
}

/** Test helper: una receta con sus ingredientes, sabor y capacidades opcionales. */
export function makeRecipe(
  id: string,
  categoryId: string,
  name: string,
  ingredients: RecipeIngredient[],
  flavorId: string | null = null,
  portionsCapacityId: string | null = null,
  moldCapacityId: string | null = null,
): Recipe {
  return Recipe.restore({
    id: new EntityId(id),
    categoryId: new EntityId(categoryId),
    name,
    ingredients,
    flavorId: flavorId ? new EntityId(flavorId) : null,
    portionsCapacityId: portionsCapacityId ? new EntityId(portionsCapacityId) : null,
    moldCapacityId: moldCapacityId ? new EntityId(moldCapacityId) : null,
  });
}

/** Test helper: un sabor de catálogo (id + label). */
export function makeFlavor(id: string, label: string): RecipeFlavor {
  return RecipeFlavor.restore({ id: new EntityId(id), label });
}

/** Test helper: una capacidad de catálogo (id + grupo + label + factor). */
export function makeCapacity(
  id: string,
  group: CapacityGroup,
  label: string,
  factor = 1,
): RecipeCapacity {
  return RecipeCapacity.restore({ id: new EntityId(id), group, label, factor });
}

/** Helper de test: un insumo con precio. */
export function makeSupply(
  id: string,
  name: string,
  options: { usage?: SupplyUsage; baseUnit?: BaseUnit; amount?: number; per?: Quantity } = {},
): Supply {
  const baseUnit = options.baseUnit ?? 'g';
  const per = options.per ?? Quantity.of(1000, baseUnit);
  return Supply.restore({
    id: new EntityId(id),
    name,
    baseUnit,
    usage: options.usage ?? 'recipe',
    purchasePrice: PurchasePrice.of(options.amount ?? 5, per),
  });
}
