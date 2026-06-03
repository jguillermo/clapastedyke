import { EntityId, IdGenerator, IdPrefix } from '../../domain/entity-id';
import { ask, openDatabase } from './database';

interface CounterRow {
  prefix: string;
  last: number;
}

/**
 * Persistent identity sequences (CL-0001, P-0042…). The increment happens
 * inside a single readwrite transaction on the 'counters' store: two
 * concurrent calls can never return the same number.
 */
export class IndexedDbIdGenerator implements IdGenerator {
  async next(prefix: IdPrefix): Promise<EntityId> {
    const db = await openDatabase();
    const tx = db.transaction('counters', 'readwrite');
    const store = tx.objectStore('counters');

    const row = await ask<CounterRow | undefined>(store.get(prefix));
    const next = (row?.last ?? 0) + 1;
    await ask(store.put({ prefix, last: next } satisfies CounterRow));

    return EntityId.create(prefix, next);
  }
}
