import { EntityId, ID_PREFIXES, IdGenerator } from '../../_common/domain/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { BasicOrder, BasicOrderPrimitives } from '../domain/basic-order/basic-order';
import { BasicOrderRepository } from '../domain/basic-order/basic-order-repository';

export class IndexedDbBasicOrderRepository implements BasicOrderRepository {
  private readonly store = new IndexedDbStore<BasicOrderPrimitives>('basic_orders');
  constructor(private readonly ids: IdGenerator) {}

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
