import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { GoalType } from '../../domain/goal-type';
import { PROGRESS_REPOSITORY } from '../../domain/progress-repository';

export interface RecordProgressRequest {
  type: GoalType;
  /** INCREMENT: cantidad a sumar (default 1). SNAPSHOT: valor actual medido. */
  value?: number;
}

/**
 * Registra avance en una meta. El aggregate decide el modo (INCREMENT/SNAPSHOT),
 * reconcilia niveles y desbloqueos, y emite los eventos que se publican aquí.
 */
@Injectable({ providedIn: 'root' })
export class RecordProgress implements UseCase<RecordProgressRequest, void> {
  private readonly repo = inject(PROGRESS_REPOSITORY);
  private readonly bus = inject(EventBusToken);

  async execute(request: RecordProgressRequest): Promise<void> {
    const progress = await this.repo.load();
    progress.record(request.type, request.value ?? 1);
    await this.repo.save(progress);
    await this.bus.publish(progress.pullEvents());
  }
}
