import { Injectable, inject } from '@angular/core';
import { UseCase } from '../../../_common/application/use-case';
import { PlayerProgress } from '../../domain/player-progress';
import { PROGRESS_REPOSITORY } from '../../domain/progress-repository';

/** Reinicia la partida (nivel 1, sin progreso). */
@Injectable({ providedIn: 'root' })
export class ResetProgress implements UseCase<void, void> {
  private readonly repo = inject(PROGRESS_REPOSITORY);

  async execute(): Promise<void> {
    await this.repo.save(PlayerProgress.start());
  }
}
