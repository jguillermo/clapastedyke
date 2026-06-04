import { GoalMode, GoalType } from './goal-type';

/**
 * Read-model de una meta con su progreso (lo que muestra ListGoals).
 * `met` es derivado: progress >= target.
 */
export interface Goal {
  readonly type: GoalType;
  readonly target: number;
  readonly progress: number;
  readonly mode: GoalMode;
  readonly met: boolean;
}
