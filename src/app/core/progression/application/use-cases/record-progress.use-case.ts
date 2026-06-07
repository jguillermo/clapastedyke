import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EventBus } from '../../../_common/event-bus';
import { GoalType } from '../../domain/goal-type';
import { ProgressRepository } from '../../domain/repositories/progress.repository';

export interface RecordProgressRequest {
    type: GoalType;
    /** INCREMENT: amount to add (default 1). SNAPSHOT: the current measured value. */
    value?: number;
}

/**
 * Records progress on a goal. The aggregate decides the mode
 * (INCREMENT/SNAPSHOT), reconciles levels and unlocks, and emits the events
 * published here after persisting.
 */
@Injectable({ providedIn: 'root' })
export class RecordProgress extends UseCase<RecordProgressRequest, void> {
    private readonly repo = inject(ProgressRepository);
    private readonly bus = inject(EventBus);

    async execute(request: RecordProgressRequest): Promise<void> {
        const progress = await this.repo.load();
        progress.record(request.type, request.value ?? 1);
        await this.repo.save(progress);
        await this.bus.publish(progress.pullEvents());
    }
}
