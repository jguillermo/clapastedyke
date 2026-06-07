import { GoalMode, GoalType } from './goal-type';

/**
 * Read model of a goal with its progress (what the UI shows). `met` is derived:
 * progress >= target.
 */
export interface Goal {
    readonly type: GoalType;
    readonly target: number;
    readonly progress: number;
    readonly mode: GoalMode;
    readonly met: boolean;
}
