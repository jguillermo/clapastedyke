import { EntityId } from '../../../_common/domain/entity-id';
import { Customer } from './customer';

/**
 * Persistence port for the Customer aggregate (in-memory collection).
 * The implementation lives in infrastructure (IndexedDB).
 */
export interface CustomerRepository {
  nextId(): Promise<EntityId>;
  byId(id: EntityId): Promise<Customer | null>;
  /** Exact case-insensitive lookup (the GAS uniqueness rule). */
  byName(name: string): Promise<Customer | null>;
  save(customer: Customer): Promise<void>;
  all(): Promise<Customer[]>;
}
