import { PlayerProgress } from '../player-progress';

/**
 * Persistence port for the progress (a singleton aggregate). `load()` seeds and
 * returns a fresh game the first time if none exists yet.
 */
export abstract class ProgressRepository {
    abstract load(): Promise<PlayerProgress>;
    abstract save(progress: PlayerProgress): Promise<void>;
}
