import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { Feature } from '../../domain/feature';
import { Goal } from '../../domain/goal';
import { ProgressRepository } from '../../domain/repositories/progress.repository';

export interface ProgressView {
    currentLevel: number;
    goals: Goal[];
    unlockedFeatures: Feature[];
}

/** Reads the current progress as a view model for the HUD. Emits no event. */
@Injectable({ providedIn: 'root' })
export class GetProgress extends UseCase<void, ProgressView> {
    private readonly repo = inject(ProgressRepository);

    async execute(): Promise<ProgressView> {
        const progress = await this.repo.load();
        return {
            currentLevel: progress.currentLevel,
            goals: progress.goalsOfCurrentLevel(),
            unlockedFeatures: progress.unlockedFeatures(),
        };
    }
}
