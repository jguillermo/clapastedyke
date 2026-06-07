/**
 * Estaciones clicables de la cocina (concepto de RENDER, no de negocio).
 * El significado de cada estación lo decide el feature que consume el motor.
 *
 * Fase 0: solo RECIPE_BOARD es interactiva (abre el libro de recetas).
 * PANTRY y OVEN se renderizan pero quedan inertes hasta el Cap. 1 (Feature KITCHEN).
 */
export enum KitchenStation {
  RECIPE_BOARD = 'RECIPE_BOARD',
  PANTRY = 'PANTRY',
  OVEN = 'OVEN',
}
