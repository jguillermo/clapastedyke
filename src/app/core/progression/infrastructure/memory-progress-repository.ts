import { PlayerProgress, PlayerProgressPrimitives } from '../domain/player-progress';
import { ProgressRepository } from '../domain/progress-repository';

/** Doble en memoria para tests. */
export class MemoryProgressRepository implements ProgressRepository {
  private current: PlayerProgressPrimitives | null = null;

  async load(): Promise<PlayerProgress> {
    this.current ??= PlayerProgress.start().toPrimitives();
    return PlayerProgress.fromPrimitives(this.current);
  }

  async save(progress: PlayerProgress): Promise<void> {
    this.current = progress.toPrimitives();
  }
}
