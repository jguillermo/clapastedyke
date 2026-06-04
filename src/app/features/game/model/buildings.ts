import { Feature } from '../../../core/progression/domain/feature';
import { AlertType } from '../../../core/dashboard/application/get-dashboard/get-dashboard';

/**
 * El pueblo = el negocio hecho lugar (mundo de la Fase 4+). Cinco edificios,
 * cada uno un dominio de la pastelería. Un edificio queda operativo cuando su
 * `Feature` está desbloqueada (ver `isBuildingOperational`); al entrar, sus
 * acciones enrutan a la pantalla operativa real (hijas de `/town`).
 *
 * Fuente de verdad del mapa edificio↔feature: `.claude/doc/diseno_mundo_juego.md`.
 * El layout 3D (posiciones) lo posee `town-engine.ts`, que coloca los edificios
 * en el orden de `BUILDINGS`.
 */
export type BuildingId = 'oficina' | 'bodega' | 'tienda' | 'obrador' | 'mercado';

/** Modelo 3D (pack SimplePoly City) del edificio. */
export interface BuildingModel {
  url: string;
  texture: string;
}

/** Una acción dentro de un edificio: un segmento de ruta bajo `/town`. */
export interface BuildingAction {
  labelKey: string;
  path: string;
}

export interface Building {
  id: BuildingId;
  nameKey: string;
  /** Función que debe estar desbloqueada para que el edificio sea operativo. */
  requires: Feature;
  color: number;
  model: BuildingModel;
  actions: BuildingAction[];
  alertTypes: AlertType[];
}

export const BUILDINGS: Building[] = [
  {
    id: 'oficina',
    nameKey: 'oficina',
    requires: Feature.PHYSICAL_STORE,
    color: 0xcf9a32,
    model: { url: 'assets/city/books-shop.fbx', texture: 'assets/city/books-shop.png' },
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
    requires: Feature.PHYSICAL_STORE,
    color: 0x8c7a5e,
    model: { url: 'assets/city/factory.fbx', texture: 'assets/city/factory.png' },
    actions: [
      { labelKey: 'supplies', path: 'supplies' },
      { labelKey: 'adjustInventory', path: 'inventory' },
    ],
    alertTypes: ['outOfStock', 'belowMinimum'],
  },
  {
    id: 'tienda',
    nameKey: 'tienda',
    requires: Feature.PHYSICAL_STORE,
    color: 0xbb5530,
    model: { url: 'assets/city/bakery.fbx', texture: 'assets/city/bakery.png' },
    actions: [
      { labelKey: 'newQuote', path: 'quotes/new' },
      { labelKey: 'viewQuotes', path: 'quotes' },
    ],
    alertTypes: ['expiringQuote', 'expiredQuote'],
  },
  {
    id: 'obrador',
    nameKey: 'obrador',
    requires: Feature.PHYSICAL_STORE,
    color: 0x4f8a5b,
    model: { url: 'assets/city/restaurant.fbx', texture: 'assets/city/restaurant.png' },
    actions: [
      { labelKey: 'viewOrders', path: 'orders' },
      { labelKey: 'recipes', path: 'recipes' },
    ],
    alertTypes: ['toDeliver'],
  },
  {
    id: 'mercado',
    nameKey: 'mercado',
    requires: Feature.PHYSICAL_STORE,
    color: 0x3f6f9c,
    model: { url: 'assets/city/super-market.fbx', texture: 'assets/city/super-market.png' },
    actions: [
      { labelKey: 'buyMaterials', path: 'purchases' },
      { labelKey: 'suppliers', path: 'suppliers' },
    ],
    alertTypes: [],
  },
];

/** Operativo cuando su `Feature` está desbloqueada. */
export function isBuildingOperational(
  building: Building,
  isUnlocked: (feature: Feature) => boolean,
): boolean {
  return isUnlocked(building.requires);
}

export function findBuilding(id: string): Building | undefined {
  return BUILDINGS.find(b => b.id === id);
}
