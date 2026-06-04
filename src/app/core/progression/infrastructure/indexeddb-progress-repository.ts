import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { PlayerProgress, PlayerProgressPrimitives, PROGRESS_ID } from '../domain/player-progress';
import { ProgressRepository } from '../domain/progress-repository';

/** Persiste el progreso (singleton) en la BD del navegador (store 'progress'). */
export class IndexedDbProgressRepository implements ProgressRepository {
  private readonly store = new IndexedDbStore<PlayerProgressPrimitives>('progress');

  async load(): Promise<PlayerProgress> {
    const doc = await this.store.get(PROGRESS_ID);
    if (doc) return PlayerProgress.fromPrimitives(doc);
    const fresh = PlayerProgress.start();
    await this.store.put(fresh.toPrimitives());
    return fresh;
  }

  async save(progress: PlayerProgress): Promise<void> {
    await this.store.put(progress.toPrimitives());
  }
}
