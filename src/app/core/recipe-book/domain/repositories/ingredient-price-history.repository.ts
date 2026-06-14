import { EntityId } from '../../../_common/entity-id';
import { PurchasePrice } from '../value-objects/purchase-price';

/** One append-only audit entry: the price an ingredient had at a point in time. */
export interface PriceHistoryEntry {
    readonly ingredientId: EntityId;
    readonly price: PurchasePrice;
    readonly recordedAt: Date;
}

/**
 * Append-only audit store of ingredient prices. **Invisible to the user** — it
 * is written only by the `IngredientPriceRecorder` subscriber reacting to
 * `IngredientRepriced`, never by the flow's use cases, and never read by the UI.
 * Not a business aggregate; it exists purely for traceability.
 */
export abstract class IngredientPriceHistoryRepository {
    abstract append(entry: PriceHistoryEntry): Promise<void>;
    abstract byIngredient(ingredientId: EntityId): Promise<PriceHistoryEntry[]>;
}
