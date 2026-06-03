import { EntityId } from '../../../_common/domain/entity-id';
import { Supplier } from './supplier';

export interface SupplierRepository {
  nextId(): Promise<EntityId>;
  byId(id: EntityId): Promise<Supplier | null>;
  byName(name: string): Promise<Supplier | null>;
  save(supplier: Supplier): Promise<void>;
  all(): Promise<Supplier[]>;
}
