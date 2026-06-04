import { InjectionToken } from '@angular/core';
import { PlayerProgress } from './player-progress';

/**
 * Puerto de persistencia del progreso (aggregate singleton). `load()` siembra
 * y devuelve una partida nueva la primera vez si aún no existe.
 */
export interface ProgressRepository {
  load(): Promise<PlayerProgress>;
  save(progress: PlayerProgress): Promise<void>;
}

export const PROGRESS_REPOSITORY = new InjectionToken<ProgressRepository>('ProgressRepository');
