import { Injectable, inject } from '@angular/core';
import { UseCase } from '../../../_common/application/use-case';
import { POPULARITY_REPOSITORY } from '../../domain/repositories';

/** Puntos de popularidad actuales (para el HUD). */
@Injectable({ providedIn: 'root' })
export class GetPopularity implements UseCase<void, { points: number }> {
  private readonly popularity = inject(POPULARITY_REPOSITORY);

  async execute(): Promise<{ points: number }> {
    return { points: (await this.popularity.load()).points };
  }
}
