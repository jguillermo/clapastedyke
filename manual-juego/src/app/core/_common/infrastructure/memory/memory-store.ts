import { EntityId, IdGenerator, IdPrefix } from '../../domain/entity-id';

/**
 * In-memory doubles for use-case tests (in-memory repositories), with the
 * same shape as the IndexedDB adapters.
 */
export class MemoryStore<Document extends { id: string }> {
  private readonly rows = new Map<string, Document>();

  async get(id: string): Promise<Document | null> {
    return this.rows.get(id) ?? null;
  }

  async all(): Promise<Document[]> {
    return [...this.rows.values()];
  }

  async put(document: Document): Promise<void> {
    this.rows.set(document.id, structuredClone(document));
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }
}

export class MemoryIdGenerator implements IdGenerator {
  private readonly counters = new Map<string, number>();

  async next(prefix: IdPrefix): Promise<EntityId> {
    const next = (this.counters.get(prefix) ?? 0) + 1;
    this.counters.set(prefix, next);
    return EntityId.create(prefix, next);
  }
}
