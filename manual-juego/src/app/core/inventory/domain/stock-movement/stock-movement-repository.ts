import { EntityId } from '../../../_common/domain/entity-id';
import { StockMovement, MovementType } from './stock-movement';

export interface StockMovementRepository {
  nextId(): Promise<EntityId>;
  save(movement: StockMovement): Promise<void>;
  all(): Promise<StockMovement[]>;
  /** An order's consumptions, to reverse them on cancellation. */
  byReferenceAndType(reference: string, type: MovementType): Promise<StockMovement[]>;
}
