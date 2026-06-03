import { EntityId } from '../../../shared/domain/entity-id';
import { Sale } from './sale';

export interface SaleRepository {
  nextId(): Promise<EntityId>;
  save(sale: Sale): Promise<void>;
  all(): Promise<Sale[]>;
}
