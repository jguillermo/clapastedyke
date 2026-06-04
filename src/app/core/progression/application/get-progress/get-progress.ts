import { Injectable, inject } from '@angular/core';
import { UseCase } from '../../../_common/application/use-case';
import { Feature } from '../../domain/feature';
import { Goal } from '../../domain/goal';
import { PROGRESS_REPOSITORY } from '../../domain/progress-repository';

/** Vista plana del progreso, lista para pintar/gatear features en la UI. */
export interface ProgressSnapshot {
  currentLevel: number;
  unlockedFeatures: Feature[];
  goals: Goal[];
}

/** Devuelve el estado actual del progreso (para la fachada de UI). */
@Injectable({ providedIn: 'root' })
export class GetProgress implements UseCase<void, ProgressSnapshot> {
  private readonly repo = inject(PROGRESS_REPOSITORY);

  async execute(): Promise<ProgressSnapshot> {
    const progress = await this.repo.load();
    return {
      currentLevel: progress.currentLevel,
      unlockedFeatures: progress.unlockedFeatures(),
      goals: progress.goalsOfCurrentLevel(),
    };
  }
}
