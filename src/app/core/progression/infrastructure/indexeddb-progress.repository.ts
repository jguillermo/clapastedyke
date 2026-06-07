import { Injectable } from '@angular/core';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { PlayerProgress, PlayerProgressPrimitives, PROGRESS_ID } from '../domain/player-progress';
import { ProgressRepository } from '../domain/repositories/progress.repository';

/** Persists the progress (singleton) in the browser database (store 'progress'). */
@Injectable()
export class IndexedDbProgressRepository extends ProgressRepository {
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
