import { Feature } from './feature';
import { GoalType } from './goal-type';

/** A level goal: reach `target` on a `GoalType`. */
export interface GoalSpec {
    readonly type: GoalType;
    readonly target: number;
}

/**
 * A level/phase: order, the goals that close it and the features it switches on
 * when completed. Cap 0 defines only Level 0 (the prelude); future chapters
 * append the linear spine.
 */
export interface Level {
    readonly order: number;
    readonly key: string; // i18n key under progression.levels.*
    readonly goals: readonly GoalSpec[];
    readonly unlocks: readonly Feature[];
}

export const LEVELS: readonly Level[] = [
    {
        order: 0,
        key: 'recipe-book',
        goals: [{ type: GoalType.CAKES_COMPOSED, target: 1 }],
        unlocks: [Feature.KITCHEN],
    },
];

export const LAST_LEVEL = LEVELS[LEVELS.length - 1].order;

/**
 * Continuous unlock rules (advanced mode): each feature switches on by its own
 * milestone. Cap 0 has none; future chapters populate this.
 */
export interface FeatureRule {
    readonly feature: Feature;
    /** Met if ANY of these conditions is reached. */
    readonly any: readonly GoalSpec[];
}

export const FEATURE_RULES: readonly FeatureRule[] = [];

export function levelByOrder(order: number): Level | undefined {
    return LEVELS.find((l) => l.order === order);
}
