import { Provider } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { BaseUnit, Quantity } from '../../_common/quantity';
import { DomainEvent } from '../../_common/domain-event';
import { EventBus, EventHandler } from '../../_common/event-bus';
import { Ingredient } from '../domain/entities/ingredient';
import { Recipe } from '../domain/entities/recipe';
import { RecipeCategory } from '../domain/entities/recipe-category';
import { PackagingRule } from '../domain/entities/packaging-rule';
import { CakeComposition } from '../domain/entities/cake-composition';
import { Flavor } from '../domain/entities/flavor';
import { ConversionGroup, ConversionOption } from '../domain/entities/conversion-option';
import { RecipeSelection } from '../domain/entities/recipe-selection';
import { PurchasePrice } from '../domain/value-objects/purchase-price';
import { IngredientUsage } from '../domain/value-objects/ingredient-usage';
import { IngredientLine } from '../domain/value-objects/ingredient-line';
import { RecipeProperty } from '../domain/value-objects/recipe-property';
import { RecipePropertyValue } from '../domain/value-objects/recipe-property-value';
import { IngredientRepository } from '../domain/repositories/ingredient.repository';
import { RecipeRepository } from '../domain/repositories/recipe.repository';
import { RecipeCategoryRepository } from '../domain/repositories/recipe-category.repository';
import { PackagingRuleRepository } from '../domain/repositories/packaging-rule.repository';
import { CakeCompositionRepository } from '../domain/repositories/cake-composition.repository';
import { FlavorRepository } from '../domain/repositories/flavor.repository';
import { ConversionOptionRepository } from '../domain/repositories/conversion-option.repository';
import { RecipeSelectionRepository } from '../domain/repositories/recipe-selection.repository';
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

class InMemoryFlavorRepository extends FlavorRepository {
    private readonly store = new Store<Flavor>('FL');
    nextIdentity = () => this.store.next();
    byId = async (id: EntityId) => this.store.byId(id);
    save = async (f: Flavor) => this.store.save(f);
    all = async () => this.store.all();
    delete = async (id: EntityId) => {
        this.store.items.delete(id.value);
    };
}

class InMemoryConversionOptionRepository extends ConversionOptionRepository {
    private readonly store = new Store<ConversionOption>('CO');
    nextIdentity = () => this.store.next();
    byId = async (id: EntityId) => this.store.byId(id);
    byGroup = async (group: ConversionGroup) => this.store.all().filter((o) => o.group === group);
    save = async (o: ConversionOption) => this.store.save(o);
    all = async () => this.store.all();
    delete = async (id: EntityId) => {
        this.store.items.delete(id.value);
    };
}

class InMemoryRecipeSelectionRepository extends RecipeSelectionRepository {
    private readonly store = new Store<RecipeSelection>('SEL');
    nextIdentity = () => this.store.next();
    byId = async (id: EntityId) => this.store.byId(id);
    byRecipe = async (recipeId: EntityId) =>
        this.store.all().filter((s) => s.recipeId.equals(recipeId));
    save = async (s: RecipeSelection) => this.store.save(s);
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
    { provide: RecipeRepository, useClass: InMemoryRecipeRepository },
    { provide: RecipeCategoryRepository, useClass: InMemoryRecipeCategoryRepository },
    { provide: PackagingRuleRepository, useClass: InMemoryPackagingRuleRepository },
    { provide: CakeCompositionRepository, useClass: InMemoryCakeCompositionRepository },
    { provide: IngredientPriceHistoryRepository, useClass: InMemoryIngredientPriceHistoryRepository },
    { provide: FlavorRepository, useClass: InMemoryFlavorRepository },
    { provide: ConversionOptionRepository, useClass: InMemoryConversionOptionRepository },
    { provide: RecipeSelectionRepository, useClass: InMemoryRecipeSelectionRepository },
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

/** Test helper: una categoría con una propiedad de Peso (rol de escalado). */
export function makeWeightCategory(id: string, name: string, order = 0, system = true): RecipeCategory {
    return RecipeCategory.create(
        new EntityId(id),
        name,
        order,
        [RecipeProperty.create(`${id}-peso`, 'Peso', 'weight', true, true, 'scaling-weight')],
        system,
    );
}

/** Test helper: una receta con un valor de peso (en gramos) y sus líneas. */
export function makeRecipe(
    id: string,
    categoryId: string,
    name: string,
    weightGrams: number,
    lines: IngredientLine[],
): Recipe {
    return Recipe.create(
        new EntityId(id),
        new EntityId(categoryId),
        name,
        [RecipePropertyValue.of(`${categoryId}-peso`, 'weight', Quantity.of(weightGrams, 'g'))],
        lines,
    );
}

/**
 * Test helper: una categoría tipo Queques convertible — Sabor (flavor), Porciones
 * (opciones del grupo `portions`) y Molde (opciones del grupo `mold`). Sin Peso.
 */
export function makeConvertibleCategory(id: string): RecipeCategory {
    return RecipeCategory.create(
        new EntityId(id),
        'Queques',
        0,
        [
            RecipeProperty.create(`${id}-sabor`, 'Sabor', 'flavor', false, false, undefined, undefined, true),
            RecipeProperty.create(`${id}-porciones`, 'Porciones', 'options', false, false, undefined, 'portions', true),
            RecipeProperty.create(`${id}-molde`, 'Molde', 'options', false, false, undefined, 'mold', true),
        ],
        true,
    );
}

/** Test helper: una receta base (factor 1) con sus líneas. */
export function makeConvertibleRecipe(
    id: string,
    categoryId: string,
    name: string,
    lines: IngredientLine[],
): Recipe {
    return Recipe.create(new EntityId(id), new EntityId(categoryId), name, [], lines);
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
