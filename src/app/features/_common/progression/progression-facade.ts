import { Injectable, computed, inject, signal } from '@angular/core';
import { GetProgress, ProgressSnapshot } from '../../../core/progression/application/get-progress/get-progress';
import { Feature } from '../../../core/progression/domain/feature';
import { Goal } from '../../../core/progression/domain/goal';

/**
 * Fachada reactiva del progreso para la UI: expone nivel actual, metas y qué
 * funciones están desbloqueadas (para gatear campos/acciones según la fase).
 * Delega en el caso de uso GetProgress (sin lógica de negocio propia).
 * Las pantallas llaman a `refresh()` al iniciar y tras cada acción relevante.
 */
@Injectable({ providedIn: 'root' })
export class ProgressionFacade {
  private readonly getProgress = inject(GetProgress);
  private readonly _snapshot = signal<ProgressSnapshot | null>(null);

  readonly snapshot = this._snapshot.asReadonly();
  readonly currentLevel = computed(() => this._snapshot()?.currentLevel ?? 1);
  readonly goals = computed<Goal[]>(() => this._snapshot()?.goals ?? []);
  readonly unlockedFeatures = computed<Feature[]>(() => this._snapshot()?.unlockedFeatures ?? []);

  /** Recarga el estado desde el dominio. */
  async refresh(): Promise<void> {
    this._snapshot.set(await this.getProgress.execute());
  }

  /** ¿Está desbloqueada esta función? (para divulgación progresiva en la UI). */
  isFeatureUnlocked(feature: Feature): boolean {
    return this._snapshot()?.unlockedFeatures.includes(feature) ?? false;
  }
}
