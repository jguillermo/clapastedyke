import { AggregateRoot } from '../../_common/domain/aggregate';
import { domainEvent } from '../../_common/domain/domain-event';
import { Feature, INITIAL_FEATURES } from './feature';
import { GOAL_MODE, GoalMode, GoalType } from './goal-type';
import { Goal } from './goal';
import { FEATURE_RULES, GoalSpec, LEVELS, Level, levelByOrder } from './levels';

export const PROGRESS_ID = 'PROGRESS';

export interface PlayerProgressPrimitives {
  id: string;
  currentLevel: number;
  progressByType: Partial<Record<GoalType, number>>;
  completedLevels: number[];
  unlockedFeatures: Feature[];
}

/**
 * Aggregate root de la progresión: dueño de las reglas y los invariantes.
 * Una meta INCREMENT nunca decrece; una SNAPSHOT guarda el máximo; un nivel
 * solo se cierra cuando TODAS sus metas están cumplidas; las funciones
 * desbloqueadas no se apagan.
 * Fuente de verdad: .claude/doc/plan_de_negocio.md §4.
 */
export class PlayerProgress extends AggregateRoot {
  private constructor(
    private _currentLevel: number,
    private readonly _progress: Map<GoalType, number>,
    private readonly _completedLevels: Set<number>,
    private readonly _unlocked: Set<Feature>,
  ) {
    super();
  }

  /** Partida nueva: nivel 1, sin progreso, con las funciones iniciales. */
  static start(): PlayerProgress {
    return new PlayerProgress(1, new Map(), new Set(), new Set(INITIAL_FEATURES));
  }

  static fromPrimitives(p: PlayerProgressPrimitives): PlayerProgress {
    return new PlayerProgress(
      p.currentLevel,
      new Map(Object.entries(p.progressByType) as [GoalType, number][]),
      new Set(p.completedLevels),
      new Set(p.unlockedFeatures),
    );
  }

  /* ---------- Comandos ---------- */

  /** Registra avance de un tipo de meta y reconcilia niveles/funciones. */
  record(type: GoalType, value = 1): void {
    if (!Number.isFinite(value)) return;
    const mode = GOAL_MODE[type];
    const current = this._progress.get(type) ?? 0;
    const next = mode === GoalMode.SNAPSHOT ? Math.max(current, value) : current + value;
    if (next === current) {
      // SNAPSHOT que no supera el máximo: nada cambia.
      return;
    }
    this._progress.set(type, next);
    this.recordEvent(domainEvent('ProgressRecorded', PROGRESS_ID, { type, value: next }));
    this.reconcile();
  }

  /**
   * Atajo: fuerza el avance hasta `targetLevel`, marcando como satisfechos los
   * niveles intermedios y desbloqueando sus funciones. Para usuarios que ya
   * conocen el juego.
   */
  forceLevelUp(targetLevel: number): void {
    const target = Math.max(1, Math.floor(targetLevel));
    const previous = this._currentLevel;
    for (const level of LEVELS) {
      if (level.order < target) {
        this._completedLevels.add(level.order);
        for (const f of level.unlocks) this.unlock(f);
      }
    }
    this._currentLevel = target;
    if (target !== previous) {
      this.recordEvent(
        domainEvent('LevelAdvanced', PROGRESS_ID, { previousLevel: previous, newLevel: target, forced: true }),
      );
    }
    this.reconcile();
  }

  /* ---------- Reconciliación interna ---------- */

  private reconcile(): void {
    // Espina lineal: cierra niveles consecutivos cuyas metas estén cumplidas.
    let level = levelByOrder(this._currentLevel);
    while (level && this.levelMet(level)) {
      this._completedLevels.add(level.order);
      for (const f of level.unlocks) this.unlock(f);
      const previous = this._currentLevel;
      this._currentLevel = level.order + 1;
      this.recordEvent(
        domainEvent('LevelAdvanced', PROGRESS_ID, {
          previousLevel: previous,
          newLevel: this._currentLevel,
          forced: false,
        }),
      );
      level = levelByOrder(this._currentLevel);
    }
    // Modo avanzado: desbloqueos por hito propio (continuos).
    for (const rule of FEATURE_RULES) {
      if (!this._unlocked.has(rule.feature) && rule.any.some(g => this.specMet(g))) {
        this.unlock(rule.feature);
      }
    }
  }

  private unlock(feature: Feature): void {
    if (this._unlocked.has(feature)) return;
    this._unlocked.add(feature);
    this.recordEvent(domainEvent('FeatureUnlocked', PROGRESS_ID, { feature }));
  }

  private levelMet(level: Level): boolean {
    return level.goals.every(g => this.specMet(g));
  }

  private specMet(spec: GoalSpec): boolean {
    return (this._progress.get(spec.type) ?? 0) >= spec.target;
  }

  /* ---------- Consultas ---------- */

  get currentLevel(): number {
    return this._currentLevel;
  }

  isFeatureUnlocked(feature: Feature): boolean {
    return this._unlocked.has(feature);
  }

  unlockedFeatures(): Feature[] {
    return [...this._unlocked];
  }

  progressOf(type: GoalType): number {
    return this._progress.get(type) ?? 0;
  }

  /** Metas del nivel actual con su progreso (para mostrar qué falta). */
  goalsOfCurrentLevel(): Goal[] {
    const level = levelByOrder(this._currentLevel);
    if (!level) return [];
    return level.goals.map(g => {
      const progress = this._progress.get(g.type) ?? 0;
      return { type: g.type, target: g.target, progress, mode: GOAL_MODE[g.type], met: progress >= g.target };
    });
  }

  toPrimitives(): PlayerProgressPrimitives {
    return {
      id: PROGRESS_ID,
      currentLevel: this._currentLevel,
      progressByType: Object.fromEntries(this._progress) as Partial<Record<GoalType, number>>,
      completedLevels: [...this._completedLevels],
      unlockedFeatures: [...this._unlocked],
    };
  }
}
