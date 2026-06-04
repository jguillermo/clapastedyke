import { Feature } from './feature';
import { GoalType } from './goal-type';

/** Una meta de nivel: alcanzar `target` en un `GoalType`. */
export interface GoalSpec {
  readonly type: GoalType;
  readonly target: number;
}

/**
 * Un nivel/fase: orden, metas que lo cierran y funciones que enciende al
 * completarse. Espina lineal de la progresión (Fases 1–4).
 * Fuente de verdad: .claude/doc/plan_de_negocio.md §4.4.
 */
export interface Level {
  readonly order: number;
  readonly key: string; // i18n key bajo progression.levels.*
  readonly goals: readonly GoalSpec[];
  readonly unlocks: readonly Feature[];
}

export const LEVELS: readonly Level[] = [
  {
    order: 1,
    key: 'home',
    goals: [
      { type: GoalType.PURCHASES_REGISTERED, target: 1 },
      { type: GoalType.WAREHOUSES_STOCKED, target: 3 },
      { type: GoalType.PRODUCTIONS_COOKED, target: 1 },
    ],
    unlocks: [Feature.SOCIAL],
  },
  {
    order: 2,
    key: 'social',
    goals: [
      { type: GoalType.PRODUCTIONS_COOKED, target: 4 },
      { type: GoalType.POSTS_PUBLISHED, target: 3 },
      { type: GoalType.POPULARITY, target: 100 },
      { type: GoalType.INFORMAL_ORDERS, target: 1 },
    ],
    unlocks: [Feature.CUSTOMERS, Feature.ORDERS],
  },
  {
    order: 3,
    key: 'firstCustomer',
    goals: [
      { type: GoalType.CUSTOMERS_REGISTERED, target: 1 },
      { type: GoalType.ORDERS_CREATED, target: 1 },
      { type: GoalType.SALES_COMPLETED, target: 1 },
    ],
    unlocks: [],
  },
  {
    order: 4,
    key: 'firstSales',
    goals: [{ type: GoalType.SALES_COMPLETED, target: 5 }],
    unlocks: [Feature.PHYSICAL_STORE],
  },
];

export const LAST_LEVEL = LEVELS[LEVELS.length - 1].order;

/**
 * Reglas de desbloqueo del modo avanzado (Fase 5+): cada función se enciende
 * por su propio hito, evaluado de forma continua una vez abierta la tienda.
 * Fuente de verdad: .claude/doc/plan_de_negocio.md §8.
 */
export interface FeatureRule {
  readonly feature: Feature;
  /** Se cumple si CUALQUIERA de estas condiciones se alcanza. */
  readonly any: readonly GoalSpec[];
}

export const FEATURE_RULES: readonly FeatureRule[] = [
  { feature: Feature.QUOTING, any: [{ type: GoalType.SALES_COMPLETED, target: 10 }] },
  {
    feature: Feature.TAX,
    any: [
      { type: GoalType.SALES_COMPLETED, target: 20 },
      { type: GoalType.ACCUMULATED_REVENUE, target: 2000 },
    ],
  },
  { feature: Feature.SUPPLIERS, any: [{ type: GoalType.PURCHASES_REGISTERED, target: 3 }] },
  { feature: Feature.OPERATING_COSTS, any: [{ type: GoalType.ORDERS_CREATED, target: 15 }] },
  { feature: Feature.SPOILAGE, any: [{ type: GoalType.SUPPLIES_IN_STOCK, target: 8 }] },
  { feature: Feature.PACKAGING_RULES, any: [{ type: GoalType.SIZES_SOLD, target: 3 }] },
  { feature: Feature.EQUIPMENT, any: [{ type: GoalType.ORDERS_PER_WEEK, target: 10 }] },
  { feature: Feature.EMPLOYEES, any: [{ type: GoalType.CONCURRENT_ORDERS, target: 5 }] },
  { feature: Feature.DELIVERY, any: [{ type: GoalType.SALES_COMPLETED, target: 30 }] },
  { feature: Feature.MARKETING, any: [{ type: GoalType.POPULARITY, target: 1000 }] },
  { feature: Feature.FINANCE, any: [{ type: GoalType.MONTHS_OPERATING, target: 3 }] },
  { feature: Feature.BRANCHES, any: [{ type: GoalType.ACCUMULATED_REVENUE, target: 20000 }] },
];

export function levelByOrder(order: number): Level | undefined {
  return LEVELS.find(l => l.order === order);
}
