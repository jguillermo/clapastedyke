import { EntityId, ID_PREFIXES, IdGenerator } from '../../_common/domain/entity-id';
import { MemoryIdGenerator, MemoryStore } from '../../_common/infrastructure/memory/memory-store';
import { BasicOrder, BasicOrderPrimitives } from '../domain/basic-order/basic-order';
import { BasicOrderRepository } from '../domain/basic-order/basic-order-repository';

export class MemoryBasicOrderRepository implements BasicOrderRepository {
  private readonly store = new MemoryStore<BasicOrderPrimitives>();
  constructor(private readonly ids: IdGenerator = new MemoryIdGenerator()) {}

  nextId() {
    return this.ids.next(ID_PREFIXES.basicOrder);
  }
  async byId(id: EntityId) {
    const doc = await this.store.get(id.value);
    return doc ? BasicOrder.fromPrimitives(doc) : null;
  }
  async save(order: BasicOrder) {
    await this.store.put(order.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(BasicOrder.fromPrimitives);
  }
}
