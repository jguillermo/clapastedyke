import { EntityId } from '../../../_common/domain/entity-id';
import { Order } from './order';

export interface OrderRepository {
  nextId(): Promise<EntityId>;
  byId(id: EntityId): Promise<Order | null>;
  save(order: Order): Promise<void>;
  all(): Promise<Order[]>;
}
