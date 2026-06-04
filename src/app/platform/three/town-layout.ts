import * as THREE from 'three';

/**
 * Pure layout/config for the town scene — no logic, no Three objects with
 * state. Tweaking the look (positions, scales, fleet, palette) happens here.
 */

/** Building plots (x,z), in `BUILDINGS` order: oficina, bodega, tienda, obrador, mercado. */
export const PLOTS: readonly [number, number][] = [
  [-6, -3.2], // oficina
  [-2, -3.2], // bodega
  [0, 1.2], //   tienda — front center (park left, parking right)
  [2, -3.2], //  obrador
  [6, -3.2], //  mercado
];

export const PIN_COLOR = { amber: 0xcf9a32, red: 0xbf412c } as const;

export const BUILDING_FOOTPRINT = 2.7;
export const CAR_FOOTPRINT = 1.4; // ~half a building wide
export const PERSON_SCALE = 0.36; // ~0.5u tall
export const CHEF_SCALE = 0.45; // mascot, only a bit taller than pedestrians

export const CAMERA_HOME = { x: 0, y: 7, z: 14.5 } as const;
export const LOOK_HOME = new THREE.Vector3(0, 0.4, 0);

/** Street grid: horizontal roads at constant z, vertical roads at constant x. */
export const ROADS_X = [3.3, -1, -5.4];
export const ROADS_Z = [-4, 4];
export const X_SPAN = 9; // half-extent for horizontal roads / wrap
export const Z_MIN = -6;
export const Z_MAX = 4;
export const ROAD_W = 1.5;

/**
 * Pedestrian sidewalks: the `z` of the walkable strip in front of each block row
 * (inner/building side of a road). Shared by the scenery (draws the sidewalk)
 * and the traffic (walks people on it).
 */
export const WALK_LANES = [2.25, -2.05] as const;
/** `x` of the sidewalks flanking the vertical roads, where z-walkers walk. */
export const WALK_LANES_Z = [-2.9, 2.9] as const;
export const SIDEWALK_W = 0.7;
export const SIDEWALK_COLOR = 0xded4c0;

export interface CarSpec {
  /** Asset base name in assets/city (`car`, `taxi`, `suv`). */
  url: string;
  /** true = drives along z (vertical road); false = along x. */
  axisZ: boolean;
  /** The fixed perpendicular coordinate of the lane. */
  lane: number;
  dir: number; // +1 / -1
  speed: number;
  start: number;
}

export const FLEET: readonly CarSpec[] = [
  { url: 'car', axisZ: false, lane: 3.3, dir: 1, speed: 2, start: -6 },
  { url: 'taxi', axisZ: false, lane: 3.3, dir: 1, speed: 1.5, start: 1 },
  { url: 'car', axisZ: false, lane: -1, dir: -1, speed: 1.8, start: 5 },
  { url: 'suv', axisZ: true, lane: -4, dir: 1, speed: 1.4, start: -3 },
  { url: 'taxi', axisZ: true, lane: 4, dir: -1, speed: 1.6, start: 2 },
];

/** [shirt, pants] colors for the low-poly pedestrians. */
export const PEOPLE_TONES: readonly [number, number][] = [
  [0xbb5530, 0x2a2420],
  [0x4f8a5b, 0x3a2f28],
  [0x3f6f9c, 0x5a4a3a],
  [0xcf9a32, 0x2a2420],
  [0x9a4324, 0x47402f],
  [0x6f9c3f, 0x2a2420],
];

/** Flat-shaded opaque material — the town's default look. */
export function solid(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 1 });
}

/** Eased 0→1 for the cinematic camera dolly. */
export function easeInOut(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}
