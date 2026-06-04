/**
 * Tipos de meta del juego. Lista canónica y cerrada de "qué cuenta el juego".
 * Fuente de verdad: .claude/doc/plan_de_negocio.md §4.1.
 */
export enum GoalType {
  PURCHASES_REGISTERED = 'PURCHASES_REGISTERED', // compras de ingredientes anotadas
  WAREHOUSES_STOCKED = 'WAREHOUSES_STOCKED', // almacenes con stock suficiente a la vez
  PRODUCTIONS_COOKED = 'PRODUCTIONS_COOKED', // recetas preparadas con éxito
  POSTS_PUBLISHED = 'POSTS_PUBLISHED', // producciones publicadas en redes
  POPULARITY = 'POPULARITY', // puntos de popularidad acumulados
  INFORMAL_ORDERS = 'INFORMAL_ORDERS', // pedidos informales atendidos
  CUSTOMERS_REGISTERED = 'CUSTOMERS_REGISTERED', // clientes dados de alta
  ORDERS_CREATED = 'ORDERS_CREATED', // pedidos formales creados
  SALES_COMPLETED = 'SALES_COMPLETED', // pedidos entregados y cobrados
  SUPPLIES_IN_STOCK = 'SUPPLIES_IN_STOCK', // insumos distintos en inventario
  SIZES_SOLD = 'SIZES_SOLD', // tamaños distintos vendidos
  ORDERS_PER_WEEK = 'ORDERS_PER_WEEK', // pedidos atendidos en una semana
  CONCURRENT_ORDERS = 'CONCURRENT_ORDERS', // pedidos en producción a la vez
  ACCUMULATED_REVENUE = 'ACCUMULATED_REVENUE', // ingreso total acumulado
  MONTHS_OPERATING = 'MONTHS_OPERATING', // meses con la tienda en operación
}

/** Cómo se actualiza el progreso de una meta. */
export enum GoalMode {
  INCREMENT = 'INCREMENT', // acumulativa: suma cada vez que ocurre el hecho
  SNAPSHOT = 'SNAPSHOT', // instantánea: conserva el máximo valor observado
}

/**
 * Modo intrínseco de cada tipo de meta. Un contador acumulativo (compras,
 * ventas) usa INCREMENT; una condición medida en un momento (almacenes a la
 * vez, pedidos simultáneos) usa SNAPSHOT (máximo alcanzado).
 */
export const GOAL_MODE: Record<GoalType, GoalMode> = {
  [GoalType.PURCHASES_REGISTERED]: GoalMode.INCREMENT,
  [GoalType.WAREHOUSES_STOCKED]: GoalMode.SNAPSHOT,
  [GoalType.PRODUCTIONS_COOKED]: GoalMode.INCREMENT,
  [GoalType.POSTS_PUBLISHED]: GoalMode.INCREMENT,
  [GoalType.POPULARITY]: GoalMode.SNAPSHOT,
  [GoalType.INFORMAL_ORDERS]: GoalMode.INCREMENT,
  [GoalType.CUSTOMERS_REGISTERED]: GoalMode.INCREMENT,
  [GoalType.ORDERS_CREATED]: GoalMode.INCREMENT,
  [GoalType.SALES_COMPLETED]: GoalMode.INCREMENT,
  [GoalType.SUPPLIES_IN_STOCK]: GoalMode.SNAPSHOT,
  [GoalType.SIZES_SOLD]: GoalMode.SNAPSHOT,
  [GoalType.ORDERS_PER_WEEK]: GoalMode.SNAPSHOT,
  [GoalType.CONCURRENT_ORDERS]: GoalMode.SNAPSHOT,
  [GoalType.ACCUMULATED_REVENUE]: GoalMode.INCREMENT,
  [GoalType.MONTHS_OPERATING]: GoalMode.INCREMENT,
};
