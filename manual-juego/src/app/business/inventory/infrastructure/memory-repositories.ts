import { IdGenerator, EntityId, ID_PREFIXES } from '../../shared/domain/entity-id';
import { MemoryStore, MemoryIdGenerator } from '../../shared/infrastructure/memory/memory-store';
import { Purchase, PurchasePrimitives } from '../domain/purchase/purchase';
import { PurchaseRepository } from '../domain/purchase/purchase-repository';
import {
  StockMovement,
  StockMovementPrimitives,
  MovementType,
} from '../domain/stock-movement/stock-movement';
import { StockMovementRepository } from '../domain/stock-movement/stock-movement-repository';

export class MemoryStockMovementRepository implements StockMovementRepository {
  private readonly store = new MemoryStore<StockMovementPrimitives>();
  constructor(private readonly ids: IdGenerator = new MemoryIdGenerator()) {}

  nextId() {
    return this.ids.next(ID_PREFIXES.stockMovement);
  }
  async save(movement: StockMovement) {
    await this.store.put(movement.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(StockMovement.fromPrimitives);
  }
  async byReferenceAndType(reference: string, type: MovementType) {
    return (await this.store.all())
      .filter(m => m.reference === reference && m.type === type)
      .map(StockMovement.fromPrimitives);
  }
}

export class MemoryPurchaseRepository implements PurchaseRepository {
  private readonly store = new MemoryStore<PurchasePrimitives>();
  constructor(private readonly ids: IdGenerator = new MemoryIdGenerator()) {}

  nextId() {
    return this.ids.next(ID_PREFIXES.purchase);
  }
  async byId(id: EntityId) {
    const doc = await this.store.get(id.value);
    return doc ? Purchase.fromPrimitives(doc) : null;
  }
  async save(purchase: Purchase) {
    await this.store.put(purchase.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(Purchase.fromPrimitives);
  }
}
