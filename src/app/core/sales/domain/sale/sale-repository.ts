import { EntityId } from '../../../_common/domain/entity-id';
import { Sale } from './sale';

export interface SaleRepository {
  nextId(): Promise<EntityId>;
  save(sale: Sale): Promise<void>;
  all(): Promise<Sale[]>;
}
