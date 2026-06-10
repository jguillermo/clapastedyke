/**
 * Goal types: the canonical, closed list of "what the game counts". Cap 0 only
 * counts composed cakes; future chapters add more members.
 */
export enum GoalType {
    CAKES_COMPOSED = 'CAKES_COMPOSED', // tortas compuestas con su lista de compra
}

/** How a goal's progress is updated. */
export enum GoalMode {
    INCREMENT = 'INCREMENT', // cumulative: sums each time the fact happens
    SNAPSHOT = 'SNAPSHOT', // instantaneous: keeps the maximum observed value
}

/** Intrinsic mode of each goal type. */
export const GOAL_MODE: Record<GoalType, GoalMode> = {
    [GoalType.CAKES_COMPOSED]: GoalMode.INCREMENT,
};
