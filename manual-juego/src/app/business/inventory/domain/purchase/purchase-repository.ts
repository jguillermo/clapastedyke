import { EntityId } from '../../../shared/domain/entity-id';
import { Purchase } from './purchase';

export interface PurchaseRepository {
  nextId(): Promise<EntityId>;
  byId(id: EntityId): Promise<Purchase | null>;
  save(purchase: Purchase): Promise<void>;
  all(): Promise<Purchase[]>;
}
