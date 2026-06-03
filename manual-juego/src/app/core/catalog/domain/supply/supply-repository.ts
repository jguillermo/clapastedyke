import { EntityId } from '../../../_common/domain/entity-id';
import { Supply, SupplyType } from './supply';

export interface SupplyRepository {
  nextId(): Promise<EntityId>;
  byId(id: EntityId): Promise<Supply | null>;
  byName(name: string): Promise<Supply | null>;
  save(supply: Supply): Promise<void>;
  all(): Promise<Supply[]>;
  /** Filtered catalog: 'packaging' for packaging rules and quotes. */
  byType(type: SupplyType): Promise<Supply[]>;
}
