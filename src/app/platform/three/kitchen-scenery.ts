import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
  type ColorRepresentation,
} from 'three';
import { KitchenStation } from './kitchen-station';

/**
 * Cocina PLACEHOLDER construida con primitivas low-poly (sin assets).
 *
 * Aislada tras `buildKitchenScenery` a propósito: cuando se exporte el GLB de
 * `isometric cozy kitchen.blend` (ver .claude/doc/mundo_3d_assets.md) se sustituye
 * esta función por la carga del modelo, sin tocar el motor (`kitchen-engine.ts`).
 *
 * Paleta tomada de los tokens Migo (skill migo-design): neutros tibios para la
 * sala y acentos de marca (miel / terracota / pistacho) para las estaciones.
 */

// Paleta (hex de los tokens Migo).
const COLOR = {
  floor: 0xe8d9c4, // masa-200
  wall: 0xf4eada, // masa-100
  wallSide: 0xfbf4e9, // crema
  wood: 0xd6c2a6, // masa-300 (mesada / muebles)
  woodDark: 0xa8937c, // cacao-400
  board: 0xe8a33d, // miel-400 — estación RECIPE_BOARD
  boardPaper: 0xfffbf4, // nata-tibia
  oven: 0xc75d43, // terra-400 — estación OVEN (inerte en Fase 0)
  pantry: 0x9fbe6f, // pist-300 — estación PANTRY (inerte en Fase 0)
  plant: 0x82a84f, // pist-400
} as const;

/** Resultado del montaje: el grupo a añadir y los datos que el motor necesita. */
export interface KitchenScenery {
  /** Raíz de la escena estática + estaciones. */
  readonly root: Group;
  /** Meshes clicables (con `userData.station`). El motor hace raycast contra estos. */
  readonly stationHotspots: Mesh[];
  /** Punto al que mira la cámara al enfocar cada estación. */
  readonly focusTargets: Map<KitchenStation, Vector3>;
}

function material(color: ColorRepresentation): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, roughness: 0.92, metalness: 0 });
}

/** Caja apoyada por su base en `y`. */
function box(
  w: number,
  h: number,
  d: number,
  color: ColorRepresentation,
  x: number,
  y: number,
  z: number,
): Mesh {
  const mesh = new Mesh(new BoxGeometry(w, h, d), material(color));
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildKitchenScenery(): KitchenScenery {
  const root = new Group();
  const stationHotspots: Mesh[] = [];
  const focusTargets = new Map<KitchenStation, Vector3>();

  // ---- Piso ----
  const floor = new Mesh(new PlaneGeometry(8, 8), material(COLOR.floor));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  // ---- Paredes (esquina) ----
  const backWall = new Mesh(new PlaneGeometry(8, 4), material(COLOR.wall));
  backWall.position.set(0, 2, -4);
  backWall.receiveShadow = true;
  root.add(backWall);

  const sideWall = new Mesh(new PlaneGeometry(8, 4), material(COLOR.wallSide));
  sideWall.rotation.y = Math.PI / 2;
  sideWall.position.set(-4, 2, 0);
  sideWall.receiveShadow = true;
  root.add(sideWall);

  // ---- Mesada corrida (back wall) ----
  root.add(box(5, 0.9, 1, COLOR.wood, -0.5, 0, -3.4));
  // zócalo bajo la mesada
  root.add(box(5, 0.2, 1, COLOR.woodDark, -0.5, 0, -3.4));

  // ---- Estación OVEN (back-left, inerte en Fase 0) ----
  const oven = box(1.2, 1.3, 1, COLOR.oven, -2.6, 0, -3.4);
  oven.userData['station'] = KitchenStation.OVEN;
  root.add(oven);
  stationHotspots.push(oven);
  focusTargets.set(KitchenStation.OVEN, new Vector3(-2.6, 1.0, -3.0));

  // ---- Estación PANTRY (repisas en pared lateral, inerte en Fase 0) ----
  const pantry = new Group();
  for (let i = 0; i < 3; i++) {
    pantry.add(box(0.9, 0.12, 1.6, COLOR.pantry, -3.5, 1.0 + i * 0.7, -1.2));
  }
  // hotspot envolvente para clic/raycast
  const pantryHotspot = box(0.95, 2.3, 1.7, COLOR.pantry, -3.5, 0.9, -1.2);
  pantryHotspot.material = new MeshStandardMaterial({
    color: COLOR.pantry,
    transparent: true,
    opacity: 0,
  });
  pantryHotspot.userData['station'] = KitchenStation.PANTRY;
  pantry.add(pantryHotspot);
  root.add(pantry);
  stationHotspots.push(pantryHotspot);
  focusTargets.set(KitchenStation.PANTRY, new Vector3(-3.0, 1.6, -1.2));

  // ---- Estación RECIPE_BOARD (atril con el libro, foco de la Fase 0) ----
  const board = new Group();
  // mesita
  board.add(box(1.4, 0.85, 0.9, COLOR.wood, 1.4, 0, 1.4));
  // atril inclinado (el tablero)
  const easel = new Mesh(new BoxGeometry(1.0, 1.0, 0.08), material(COLOR.board));
  easel.position.set(1.4, 1.35, 1.4);
  easel.rotation.x = -0.5;
  easel.castShadow = true;
  board.add(easel);
  // hoja del libro
  const paper = new Mesh(new PlaneGeometry(0.7, 0.7), material(COLOR.boardPaper));
  paper.position.set(1.4, 1.37, 1.46);
  paper.rotation.x = -0.5;
  board.add(paper);
  easel.userData['station'] = KitchenStation.RECIPE_BOARD;
  paper.userData['station'] = KitchenStation.RECIPE_BOARD;
  root.add(board);
  stationHotspots.push(easel, paper);
  focusTargets.set(KitchenStation.RECIPE_BOARD, new Vector3(1.4, 1.3, 1.4));

  // ---- Una plantita para dar vida (decoración, no interactiva) ----
  const pot = box(0.35, 0.35, 0.35, COLOR.woodDark, 2.6, 0.9, -3.4);
  root.add(pot);
  const leaves = new Mesh(new CylinderGeometry(0, 0.35, 0.7, 6), material(COLOR.plant));
  leaves.position.set(2.6, 1.6, -3.4);
  leaves.castShadow = true;
  root.add(leaves);

  return { root, stationHotspots, focusTargets };
}
