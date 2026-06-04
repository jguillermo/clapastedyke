import { Difficulty } from './tutorial-types';
import { AlertType } from '../../../core/dashboard/application/get-dashboard/get-dashboard';

/**
 * The town = the business made place. Five buildings, each one a domain of the
 * pastry shop. A building opens (becomes operational) when its level is reached;
 * entering it routes to its real operational screen, rendered in the town's
 * overlay outlet (the former `/system/*` screens, now children of `/town`).
 *
 * This file is the single source of truth for the building↔feature map
 * (see `.claude/doc/diseno_mundo_juego.md`). The 3D layout (plot positions) is
 * owned by `town-engine.ts`, which places buildings in the order of `BUILDINGS`.
 */

export type BuildingId = 'oficina' | 'bodega' | 'tienda' | 'obrador' | 'mercado';

/** 3D model (SimplePoly City pack) used to render the building in the town. */
export interface BuildingModel {
  /** FBX served from public/, e.g. 'assets/city/bakery.fbx'. */
  url: string;
  /** Texture atlas PNG applied to the model's meshes. */
  texture: string;
}

/** One action inside a building: a route segment under `/town`. */
export interface BuildingAction {
  /** i18n key under `game.town.actions.*`. */
  labelKey: string;
  /** Route relative to `/town`, e.g. 'quotes' or 'quotes/new'. */
  path: string;
}

export interface Building {
  id: BuildingId;
  /** i18n key under `game.town.buildings.*` → { name, tagline }. */
  nameKey: string;
  /**
   * The level this building belongs to. The building is operational once every
   * previous level is 100% complete (see `isBuildingOperational`).
   */
  level: Difficulty;
  /** Accent color of the building in the 3D world (hex int). */
  color: number;
  /** 3D model rendered on its plot (SimplePoly City). */
  model: BuildingModel;
  /** Where the locked CTA sends the player: the level's opening mission. */
  unlockMissionId: string;
  actions: BuildingAction[];
  /** Dashboard alert types pinned over this building. */
  alertTypes: AlertType[];
}

export const BUILDINGS: Building[] = [
  {
    id: 'oficina',
    nameKey: 'oficina',
    level: 'basic',
    color: 0xcf9a32, // amber
    model: { url: 'assets/city/books-shop.fbx', texture: 'assets/city/books-shop.png' },
    unlockMissionId: 'f12',
    actions: [
      { labelKey: 'settings', path: 'settings' },
      { labelKey: 'customers', path: 'customers' },
      { labelKey: 'packagingRules', path: 'packaging-rules' },
    ],
    alertTypes: [],
  },
  {
    id: 'bodega',
    nameKey: 'bodega',
    level: 'basic',
    color: 0x8c7a5e, // taupe / sacks
    model: { url: 'assets/city/factory.fbx', texture: 'assets/city/factory.png' },
    unlockMissionId: 'f08',
    actions: [
      { labelKey: 'supplies', path: 'supplies' },
      { labelKey: 'adjustInventory', path: 'inventory' },
    ],
    alertTypes: ['outOfStock', 'belowMinimum'],
  },
  {
    id: 'tienda',
    nameKey: 'tienda',
    level: 'intermediate',
    color: 0xbb5530, // accent rust — the storefront, the heart
    model: { url: 'assets/city/bakery.fbx', texture: 'assets/city/bakery.png' },
    unlockMissionId: 'f01',
    actions: [
      { labelKey: 'newQuote', path: 'quotes/new' },
      { labelKey: 'viewQuotes', path: 'quotes' },
    ],
    alertTypes: ['expiringQuote', 'expiredQuote'],
  },
  {
    id: 'obrador',
    nameKey: 'obrador',
    level: 'intermediate',
    color: 0x4f8a5b, // green
    model: { url: 'assets/city/restaurant.fbx', texture: 'assets/city/restaurant.png' },
    unlockMissionId: 'f03',
    actions: [
      { labelKey: 'viewOrders', path: 'orders' },
      { labelKey: 'recipes', path: 'recipes' },
    ],
    alertTypes: ['toDeliver'],
  },
  {
    id: 'mercado',
    nameKey: 'mercado',
    level: 'advanced',
    color: 0x3f6f9c, // blue
    model: { url: 'assets/city/super-market.fbx', texture: 'assets/city/super-market.png' },
    unlockMissionId: 'f05',
    actions: [
      { labelKey: 'buyMaterials', path: 'purchases' },
      { labelKey: 'suppliers', path: 'suppliers' },
    ],
    alertTypes: [],
  },
];

const LEVEL_ORDER: Record<Difficulty, number> = { basic: 1, intermediate: 2, advanced: 3 };

/**
 * A building is operational when every level before its own is 100% complete.
 * Pure function so it is trivially testable; the caller supplies the per-level
 * percent (from `GameState.levelPercent`).
 */
export function isBuildingOperational(
  building: Building,
  levelPercent: (level: Difficulty) => number,
): boolean {
  const target = LEVEL_ORDER[building.level];
  return (Object.keys(LEVEL_ORDER) as Difficulty[])
    .filter(l => LEVEL_ORDER[l] < target)
    .every(l => levelPercent(l) === 100);
}

export function findBuilding(id: string): Building | undefined {
  return BUILDINGS.find(b => b.id === id);
}
