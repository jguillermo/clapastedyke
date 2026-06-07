import { AggregateRoot } from '../../_common/aggregate';
import { domainEvent } from '../../_common/domain-event';
import { Feature, INITIAL_FEATURES } from './feature';
import { Goal } from './goal';
import { GOAL_MODE, GoalMode, GoalType } from './goal-type';
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
 * Aggregate root of the progression: owner of the rules and invariants. An
 * INCREMENT goal never decreases; a SNAPSHOT keeps the maximum; a level only
 * closes when ALL its goals are met; unlocked features never switch off.
 * Cap 0 starts at level 0 with the recipe book on.
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

    /** New game: level 0, no progress, with the initial features (RECIPE_BOOK). */
    static start(): PlayerProgress {
        return new PlayerProgress(0, new Map(), new Set(), new Set(INITIAL_FEATURES));
    }

    static fromPrimitives(p: PlayerProgressPrimitives): PlayerProgress {
        return new PlayerProgress(
            p.currentLevel,
            new Map(Object.entries(p.progressByType) as [GoalType, number][]),
            new Set(p.completedLevels),
            new Set(p.unlockedFeatures),
        );
    }

    /* ---------- Commands ---------- */

    /** Records progress on a goal type and reconciles levels/features. */
    record(type: GoalType, value = 1): void {
        if (!Number.isFinite(value)) return;
        const mode = GOAL_MODE[type];
        const current = this._progress.get(type) ?? 0;
        const next = mode === GoalMode.SNAPSHOT ? Math.max(current, value) : current + value;
        if (next === current) return; // SNAPSHOT below the max: nothing changes.
        this._progress.set(type, next);
        this.recordEvent(domainEvent('ProgressRecorded', PROGRESS_ID, { type, value: next }));
        this.reconcile();
    }

    /** Skips forward to `targetLevel`, marking intermediate levels satisfied. */
    forceLevelUp(targetLevel: number): void {
        const target = Math.max(0, Math.floor(targetLevel));
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

    /* ---------- Internal reconciliation ---------- */

    private reconcile(): void {
        // Linear spine: close consecutive levels whose goals are met.
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
        // Advanced mode: continuous milestone unlocks.
        for (const rule of FEATURE_RULES) {
            if (!this._unlocked.has(rule.feature) && rule.any.some((g) => this.specMet(g))) {
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
        return level.goals.every((g) => this.specMet(g));
    }

    private specMet(spec: GoalSpec): boolean {
        return (this._progress.get(spec.type) ?? 0) >= spec.target;
    }

    /* ---------- Queries ---------- */

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

    /** Goals of the current level with their progress (what is left to do). */
    goalsOfCurrentLevel(): Goal[] {
        const level = levelByOrder(this._currentLevel);
        if (!level) return [];
        return level.goals.map((g) => {
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
