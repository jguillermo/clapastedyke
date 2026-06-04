import { Type } from '@angular/core';
import { Difficulty } from './tutorial-types';
import { AlertType } from '../../../core/dashboard/application/get-dashboard/get-dashboard';

// Real operational screens (standalone, wired to use cases over IndexedDB).
// The town mounts these inside the building overlay — they ARE the daily
// operation, not the tutorial mockups in `forms/`.
import { QuoterScreen } from '../../quotes/quoter-screen';
import { QuotesScreen } from '../../quotes/quotes-screen';
import { OrdersScreen } from '../../orders/orders-screen';
import { RecipesScreen } from '../../recipes/recipes-screen';
import { SuppliesScreen } from '../../supplies/supplies-screen';
import { InventoryScreen } from '../../inventory/inventory-screen';
import { PurchasesScreen } from '../../purchases/purchases-screen';
import { SuppliersScreen } from '../../suppliers/suppliers-screen';
import { SettingsScreen } from '../../settings/settings-screen';
import { CustomersScreen } from '../../customers/customers-screen';
import { PackagingRulesScreen } from '../../packaging-rules/packaging-rules-screen';

/**
 * The town = the business made place. Five buildings, each one a domain of the
 * pastry shop. A building opens (becomes operational) when its level is reached;
 * entering it mounts its real operational screens in an overlay.
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

/** One action available inside a building: a real screen mounted in the overlay. */
export interface BuildingAction {
  /** i18n key under `game.town.actions.*`. */
  labelKey: string;
  /** Real standalone screen component, mounted via NgComponentOutlet. */
  screen: Type<unknown>;
  /**
   * The screen self-navigates away on success (e.g. the quoter jumps to the
   * quotes list). The overlay closes the town when this happens — acceptable
   * for the prototype; folded away when /system is retired.
   */
  navigatesAway?: boolean;
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
      { labelKey: 'settings', screen: SettingsScreen },
      { labelKey: 'customers', screen: CustomersScreen },
      { labelKey: 'packagingRules', screen: PackagingRulesScreen },
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
      { labelKey: 'supplies', screen: SuppliesScreen },
      { labelKey: 'adjustInventory', screen: InventoryScreen },
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
      { labelKey: 'newQuote', screen: QuoterScreen, navigatesAway: true },
      { labelKey: 'viewQuotes', screen: QuotesScreen },
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
      { labelKey: 'viewOrders', screen: OrdersScreen },
      { labelKey: 'recipes', screen: RecipesScreen },
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
      { labelKey: 'buyMaterials', screen: PurchasesScreen },
      { labelKey: 'suppliers', screen: SuppliersScreen },
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
