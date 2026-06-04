import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { PROGRESS_REPOSITORY } from '../../domain/progress-repository';

export interface ForceLevelUpRequest {
  targetLevel: number;
}

/**
 * Atajo para usuarios que ya conocen el juego: salta directo al nivel destino,
 * marcando los niveles intermedios como completados y desbloqueando sus funciones.
 */
@Injectable({ providedIn: 'root' })
export class ForceLevelUp implements UseCase<ForceLevelUpRequest, void> {
  private readonly repo = inject(PROGRESS_REPOSITORY);
  private readonly bus = inject(EventBusToken);

  async execute(request: ForceLevelUpRequest): Promise<void> {
    const progress = await this.repo.load();
    progress.forceLevelUp(request.targetLevel);
    await this.repo.save(progress);
    await this.bus.publish(progress.pullEvents());
  }
}
