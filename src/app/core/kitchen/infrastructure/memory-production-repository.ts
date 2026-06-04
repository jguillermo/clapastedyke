import { EntityId, ID_PREFIXES } from '../../_common/domain/entity-id';
import { Production } from '../domain/production/production';
import { ProductionRepository } from '../domain/production/production-repository';

/** Doble en memoria para tests. */
export class MemoryProductionRepository implements ProductionRepository {
  private readonly items: Production[] = [];
  private seq = 0;

  async nextId(): Promise<EntityId> {
    return EntityId.create(ID_PREFIXES.production, ++this.seq);
  }
  async save(production: Production): Promise<void> {
    this.items.push(production);
  }
  async all(): Promise<Production[]> {
    return [...this.items];
  }
}
