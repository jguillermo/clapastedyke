import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { PurchasePrice } from '../domain/value-objects/purchase-price';
import {
    IngredientPriceHistoryRepository,
    PriceHistoryEntry,
} from '../domain/repositories/ingredient-price-history.repository';
import { PriceHistoryEntryRecord } from './records';
import { quantityToDomain, quantityToRecord } from './value-record.mappers';

/**
 * Append-only audit store of ingredient prices in IndexedDB. Each append mints
 * its own id (history entries are never updated). Written only by the
 * IngredientPriceRecorder subscriber.
 */
@Injectable()
export class IndexedDbIngredientPriceHistoryRepository extends IngredientPriceHistoryRepository {
    private readonly store = new IndexedDbStore<PriceHistoryEntryRecord>('ingredient_price_history');

    async append(entry: PriceHistoryEntry): Promise<void> {
        await this.store.put({
            id: crypto.randomUUID(),
            ingredientId: entry.ingredientId.value,
            price: { amount: entry.price.amount, per: quantityToRecord(entry.price.per) },
            recordedAt: entry.recordedAt.toISOString(),
        });
    }

    async byIngredient(ingredientId: EntityId): Promise<PriceHistoryEntry[]> {
        const records = (await this.store.all()).filter((r) => r.ingredientId === ingredientId.value);
        return records.map((r) => ({
            ingredientId: new EntityId(r.ingredientId),
            price: PurchasePrice.of(r.price.amount, quantityToDomain(r.price.per)),
            recordedAt: new Date(r.recordedAt),
        }));
    }
}
