/**
 * Game features the progression can switch on (what gets unlocked). Cap 0 only
 * knows the recipe book (on from the start) and the kitchen (unlocked when the
 * recipe book is ready). Future chapters add more members.
 */
export enum Feature {
    RECIPE_BOOK = 'RECIPE_BOOK', // libro de recetas (activa desde el inicio del Cap 0)
    KITCHEN = 'KITCHEN', // cocina de casa (se desbloquea al cerrar el Nivel 0 → Cap 1)
}

/** Features active when the game starts (Cap 0 prelude). */
export const INITIAL_FEATURES: readonly Feature[] = [Feature.RECIPE_BOOK];
