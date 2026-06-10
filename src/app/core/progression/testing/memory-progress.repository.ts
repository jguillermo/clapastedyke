import { PlayerProgress, PlayerProgressPrimitives } from '../domain/player-progress';
import { ProgressRepository } from '../domain/repositories/progress.repository';

/** In-memory double for tests. */
export class MemoryProgressRepository extends ProgressRepository {
    private current: PlayerProgressPrimitives | null = null;

    async load(): Promise<PlayerProgress> {
        this.current ??= PlayerProgress.start().toPrimitives();
        return PlayerProgress.fromPrimitives(this.current);
    }

    async save(progress: PlayerProgress): Promise<void> {
        this.current = progress.toPrimitives();
    }
}
