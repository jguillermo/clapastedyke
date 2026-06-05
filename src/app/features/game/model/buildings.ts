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
  /** Función que debe estar desbloqueada para usar esta acción (Fase 5+). Si
   *  falta, la acción es básica y está disponible al abrir el pueblo. */
  requires?: Feature;
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
    color: 0xc98a12, // honey (token)
    model: { url: 'assets/city/books-shop.fbx', texture: 'assets/city/books-shop.png' },
    actions: [
      { labelKey: 'settings', path: 'settings' },
      { labelKey: 'customers', path: 'customers' },
      { labelKey: 'packagingRules', path: 'packaging-rules', requires: Feature.PACKAGING_RULES },
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
      { labelKey: 'adjustInventory', path: 'inventory', requires: Feature.SPOILAGE },
    ],
    alertTypes: ['outOfStock', 'belowMinimum'],
  },
  {
    id: 'tienda',
    nameKey: 'tienda',
    requires: Feature.PHYSICAL_STORE,
    color: 0xb8472a, // primary (token)
    model: { url: 'assets/city/bakery.fbx', texture: 'assets/city/bakery.png' },
    actions: [
      { labelKey: 'newQuote', path: 'quotes/new', requires: Feature.QUOTING },
      { labelKey: 'viewQuotes', path: 'quotes', requires: Feature.QUOTING },
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
      { labelKey: 'viewOrders', path: 'orders', requires: Feature.QUOTING },
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
      { labelKey: 'buyMaterials', path: 'purchases', requires: Feature.SUPPLIERS },
      { labelKey: 'suppliers', path: 'suppliers', requires: Feature.SUPPLIERS },
    ],
    alertTypes: [],
  },
];

/** Texto corto de la meta que abre cada función avanzada (para el room-menu). */
export const FEATURE_HINT: Partial<Record<Feature, string>> = {
  [Feature.QUOTING]: 'Con 10 ventas',
  [Feature.TAX]: 'Con 20 ventas',
  [Feature.SUPPLIERS]: 'Con 3 compras registradas',
  [Feature.OPERATING_COSTS]: 'Con 15 pedidos',
  [Feature.SPOILAGE]: 'Con 8 insumos en bodega',
  [Feature.PACKAGING_RULES]: 'Vendiendo 3 tamaños distintos',
};

/** Funciones avanzadas que se rastrean en el panel "Para crecer" del pueblo. */
export const ADVANCED_FEATURES: readonly Feature[] = [
  Feature.QUOTING,
  Feature.TAX,
  Feature.SUPPLIERS,
  Feature.OPERATING_COSTS,
  Feature.SPOILAGE,
  Feature.PACKAGING_RULES,
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
