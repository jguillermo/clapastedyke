import { Injectable } from '@angular/core';
import { IndexedDbStore } from '../../../_common/infrastructure/indexeddb/store';
import { SeedState } from './seed-state';

/** Documento plano del marcador de seed en el store `seed_state`. */
interface SeedStateRecord {
  id: string; // la key del seed (p. ej. 'recipe-book')
  version: number;
  appliedAt: string; // ISO
}

/** Marcador de seeds persistido en IndexedDB (store `seed_state`). */
@Injectable()
export class IndexedDbSeedState extends SeedState {
  private readonly store = new IndexedDbStore<SeedStateRecord>('seed_state');

  async appliedVersion(key: string): Promise<number | null> {
    const record = await this.store.get(key);
    return record ? record.version : null;
  }

  async markApplied(key: string, version: number): Promise<void> {
    await this.store.put({ id: key, version, appliedAt: new Date().toISOString() });
  }
}
