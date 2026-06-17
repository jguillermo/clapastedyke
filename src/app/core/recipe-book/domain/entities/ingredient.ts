import { BaseUnit } from '../../../_common/quantity';
import { EntityId } from '../../../_common/entity-id';
import { AggregateRoot } from '../../../_common/aggregate';
import { PurchasePrice } from '../value-objects/purchase-price';
import { IngredientUsage } from '../value-objects/ingredient-usage';
import { PurchasePricePrimitive, RecipeBookEvents } from '../events/recipe-book-events';

interface IngredientData {
    id: EntityId;
    name: string;
    baseUnit: BaseUnit;
    purchasePrice: PurchasePrice;
    usage: IngredientUsage;
}

/**
 * Everything bought to prepare the cake is an Ingredient (recipe insumo,
 * topper, box or base — told apart only by `usage`). Holds its purchase price.
 * Aggregate root: records `IngredientRepriced` when its price is first set
 * (`create`) or changed (`repricedTo`); `restore` rehydrates from storage
 * without emitting. The ShoppingList aggregates by ingredientId, hence identity.
 */
export class Ingredient extends AggregateRoot {
    readonly id: EntityId; // Nivel 1: identidad única del insumo
    readonly name: string; // Nivel 1: nombre del insumo (único, ver §11.2)
    readonly baseUnit: BaseUnit; // Nivel 1: unidad en la que se mide (g | u)
    readonly purchasePrice: PurchasePrice; // Nivel 1: costo de compra (presentación + precio)
    readonly usage: IngredientUsage; // Nivel 1: para qué se usa (recipe/topper/box/base)

    private constructor(data: IngredientData) {
        super();
        this.id = data.id;
        this.name = data.name;
        this.baseUnit = data.baseUnit;
        this.purchasePrice = data.purchasePrice;
        this.usage = data.usage;
    }

    /** Brand-new ingredient: records the initial price in the history. */
    static create(
        id: EntityId,
        name: string,
        baseUnit: BaseUnit,
        usage: IngredientUsage,
        purchasePrice: PurchasePrice,
    ): Ingredient {
        if (!name.trim()) {
            throw new Error('Ingredient name is required');
        }
        if (baseUnit !== purchasePrice.per.unit) {
            throw new Error(
                `Ingredient base unit (${baseUnit}) must match its purchase presentation unit (${purchasePrice.per.unit})`,
            );
        }
        const ingredient = new Ingredient({ id, name: name.trim(), baseUnit, usage, purchasePrice });
        ingredient.recordEvent(
            RecipeBookEvents.ingredientRepriced(id.value, {
                previousPrice: null,
                newPrice: toPrimitive(purchasePrice),
            }),
        );
        return ingredient;
    }

    /** Rehydrates from storage — no event (the price already existed). */
    static restore(data: IngredientData): Ingredient {
        return new Ingredient(data);
    }

    /** Changes the purchase price; returns a new instance and records the change. */
    repricedTo(newPrice: PurchasePrice): Ingredient {
        if (newPrice.per.unit !== this.baseUnit) {
            throw new Error(
                `Cannot reprice a ${this.baseUnit} ingredient with a ${newPrice.per.unit} purchase presentation`,
            );
        }
        const next = new Ingredient({ ...this.data(), purchasePrice: newPrice });
        next.recordEvent(
            RecipeBookEvents.ingredientRepriced(this.id.value, {
                previousPrice: toPrimitive(this.purchasePrice),
                newPrice: toPrimitive(newPrice),
            }),
        );
        return next;
    }

    equals(other: Ingredient): boolean {
        return this.id.equals(other.id);
    }

    private data(): IngredientData {
        return {
            id: this.id,
            name: this.name,
            baseUnit: this.baseUnit,
            purchasePrice: this.purchasePrice,
            usage: this.usage,
        };
    }
}

function toPrimitive(price: PurchasePrice): PurchasePricePrimitive {
    return { amount: price.amount, per: { value: price.per.value, unit: price.per.unit } };
}
