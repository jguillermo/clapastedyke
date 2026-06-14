import { Provider } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { BaseUnit, Quantity } from '../../_common/quantity';
import { DomainEvent } from '../../_common/domain-event';
import { EventBus, EventHandler } from '../../_common/event-bus';
import { Ingredient } from '../domain/entities/ingredient';
import { SpongeRecipe } from '../domain/entities/sponge-recipe';
import { FillingRecipe } from '../domain/entities/filling-recipe';
import { CoveringRecipe } from '../domain/entities/covering-recipe';
import { PackagingRule } from '../domain/entities/packaging-rule';
import { CakeComposition } from '../domain/entities/cake-composition';
import { PurchasePrice } from '../domain/value-objects/purchase-price';
import { IngredientUsage } from '../domain/value-objects/ingredient-usage';
import { IngredientRepository } from '../domain/repositories/ingredient.repository';
import { SpongeRecipeRepository } from '../domain/repositories/sponge-recipe.repository';
import { FillingRecipeRepository } from '../domain/repositories/filling-recipe.repository';
import { CoveringRecipeRepository } from '../domain/repositories/covering-recipe.repository';
import { PackagingRuleRepository } from '../domain/repositories/packaging-rule.repository';
import { CakeCompositionRepository } from '../domain/repositories/cake-composition.repository';
import {
    IngredientPriceHistoryRepository,
    PriceHistoryEntry,
} from '../domain/repositories/ingredient-price-history.repository';

/** Shared in-memory store backing the repository fakes. */
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

class InMemoryIngredientRepository extends IngredientRepository {
    private readonly store = new Store<Ingredient>('IN');
    nextIdentity = () => this.store.next();
    byId = async (id: EntityId) => this.store.byId(id);
    byName = async (name: string) => this.store.byName(name, (i) => i.name);
    save = async (i: Ingredient) => this.store.save(i);
    all = async () => this.store.all();
}

class InMemorySpongeRecipeRepository extends SpongeRecipeRepository {
    private readonly store = new Store<SpongeRecipe>('SP');
    nextIdentity = () => this.store.next();
    byId = async (id: EntityId) => this.store.byId(id);
    byName = async (name: string) => this.store.byName(name, (r) => r.name);
    save = async (r: SpongeRecipe) => this.store.save(r);
    all = async () => this.store.all();
}

class InMemoryFillingRecipeRepository extends FillingRecipeRepository {
    private readonly store = new Store<FillingRecipe>('FL');
    nextIdentity = () => this.store.next();
    byId = async (id: EntityId) => this.store.byId(id);
    byName = async (name: string) => this.store.byName(name, (r) => r.name);
    save = async (r: FillingRecipe) => this.store.save(r);
    all = async () => this.store.all();
}

class InMemoryCoveringRecipeRepository extends CoveringRecipeRepository {
    private readonly store = new Store<CoveringRecipe>('CV');
    nextIdentity = () => this.store.next();
    byId = async (id: EntityId) => this.store.byId(id);
    byName = async (name: string) => this.store.byName(name, (r) => r.name);
    save = async (r: CoveringRecipe) => this.store.save(r);
    all = async () => this.store.all();
}

class InMemoryPackagingRuleRepository extends PackagingRuleRepository {
    private readonly store = new Store<PackagingRule>('RL');
    nextIdentity = () => this.store.next();
    byId = async (id: EntityId) => this.store.byId(id);
    save = async (r: PackagingRule) => this.store.save(r);
    all = async () => this.store.all();
}

class InMemoryCakeCompositionRepository extends CakeCompositionRepository {
    private readonly store = new Store<CakeComposition>('CK');
    nextIdentity = () => this.store.next();
    byId = async (id: EntityId) => this.store.byId(id);
    save = async (c: CakeComposition) => this.store.save(c);
    all = async () => this.store.all();
}

/** In-memory append-only price history. */
export class InMemoryIngredientPriceHistoryRepository extends IngredientPriceHistoryRepository {
    readonly entries: PriceHistoryEntry[] = [];
    append = async (entry: PriceHistoryEntry) => {
        this.entries.push(entry);
    };
    byIngredient = async (ingredientId: EntityId) =>
        this.entries.filter((e) => e.ingredientId.equals(ingredientId));
}

/** EventBus double that records everything published for assertions. */
export class RecordingEventBus extends EventBus {
    readonly published: DomainEvent[] = [];
    async publish(events: readonly DomainEvent[]): Promise<void> {
        this.published.push(...events);
    }
    subscribe(_eventName: string, _handler: EventHandler): void {
        // no-op for tests
    }
    names(): string[] {
        return this.published.map((e) => e.name);
    }
}

/** The aggregate repository bindings to in-memory doubles (no EventBus). */
export const recipeBookRepositoryProviders: Provider[] = [
    { provide: IngredientRepository, useClass: InMemoryIngredientRepository },
    { provide: SpongeRecipeRepository, useClass: InMemorySpongeRecipeRepository },
    { provide: FillingRecipeRepository, useClass: InMemoryFillingRecipeRepository },
    { provide: CoveringRecipeRepository, useClass: InMemoryCoveringRecipeRepository },
    { provide: PackagingRuleRepository, useClass: InMemoryPackagingRuleRepository },
    { provide: CakeCompositionRepository, useClass: InMemoryCakeCompositionRepository },
    { provide: IngredientPriceHistoryRepository, useClass: InMemoryIngredientPriceHistoryRepository },
];

export interface RecipeBookFakes {
    bus: RecordingEventBus;
    providers: Provider[];
}

/** Builds fresh in-memory fakes and the matching Angular providers. */
export function makeRecipeBookFakes(): RecipeBookFakes {
    const bus = new RecordingEventBus();
    const providers: Provider[] = [...recipeBookRepositoryProviders, { provide: EventBus, useValue: bus }];
    return { bus, providers };
}

/** Test helper: a purchase-price request literal for SaveIngredient. */
export function aPurchase(unit: BaseUnit = 'g', amount = 5): { amount: number; per: { value: number; unit: BaseUnit } } {
    return { amount, per: { value: unit === 'u' ? 10 : 1000, unit } };
}

/** Test helper: a priced ingredient (uses `restore` to avoid recording events). */
export function makeIngredient(
    id: string,
    name: string,
    options: { usage?: IngredientUsage; baseUnit?: BaseUnit; amount?: number; per?: Quantity } = {},
): Ingredient {
    const baseUnit = options.baseUnit ?? 'g';
    const per = options.per ?? Quantity.of(1000, baseUnit);
    return Ingredient.restore({
        id: new EntityId(id),
        name,
        baseUnit,
        usage: options.usage ?? 'recipe',
        purchasePrice: PurchasePrice.of(options.amount ?? 5, per),
    });
}
