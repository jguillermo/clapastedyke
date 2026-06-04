import { EntityId } from '../../../_common/domain/entity-id';
import { Quote } from './quote';

export interface QuoteRepository {
  nextId(): Promise<EntityId>;
  byId(id: EntityId): Promise<Quote | null>;
  save(quote: Quote): Promise<void>;
  all(): Promise<Quote[]>;
}
