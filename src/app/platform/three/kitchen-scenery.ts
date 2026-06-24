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
  // Empieza a la DERECHA del horno (borde izq. en x=-2) para no incrustarse en él: si se
  // solaparan, sus caras frontales quedarían coplanares y aparecería z-fighting (el punteado
  // escalonado que titilaba). Ahora apenas se tocan, sin compartir volumen.
  // El zócalo va de y[0,0.2] y la mesada se APOYA encima (base en y=0.2): así sus caras
  // frontales cubren alturas distintas y no quedan coplanares (evita el z-fighting de la franja).
  root.add(box(4, 0.2, 1, COLOR.woodDark, 0, 0, -3.4)); // zócalo
  root.add(box(4, 0.7, 1, COLOR.wood, 0, 0.2, -3.4)); // mesada (apoyada sobre el zócalo)

  // ---- Estación OVEN (back-left, inerte en Fase 0) ----
  // Bloque exento a la izquierda de la mesada (ocupa x[-3.2,-2]); la mesada arranca en x=-2.
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

  // ---- Estación RECIPE_BOARD (libro de recetas cerrado, foco de la Fase 0) ----
  const board = new Group();
  // mesita
  board.add(box(1.4, 0.85, 0.9, COLOR.wood, 1.4, 0, 1.4));
  // Libro cerrado: tapa inferior + taco de páginas + tapa superior, apilados y
  // ligeramente girados. Las tres piezas son hotspots de la estación.
  const cover1 = box(0.62, 0.04, 0.82, COLOR.oven, 1.4, 0.85, 1.4);
  const pages = box(0.56, 0.07, 0.76, COLOR.boardPaper, 1.4, 0.89, 1.4);
  const cover2 = box(0.62, 0.04, 0.82, COLOR.oven, 1.4, 0.96, 1.4);
  for (const piece of [cover1, pages, cover2]) {
    piece.rotation.y = 0.3;
    piece.userData['station'] = KitchenStation.RECIPE_BOARD;
    board.add(piece);
    stationHotspots.push(piece);
  }
  root.add(board);
  focusTargets.set(KitchenStation.RECIPE_BOARD, new Vector3(1.4, 1.0, 1.4));

  // ---- Una plantita para dar vida (decoración, no interactiva) ----
  const pot = box(0.35, 0.35, 0.35, COLOR.woodDark, 2.6, 0.9, -3.4);
  root.add(pot);
  const leaves = new Mesh(new CylinderGeometry(0, 0.35, 0.7, 6), material(COLOR.plant));
  leaves.position.set(2.6, 1.6, -3.4);
  leaves.castShadow = true;
  root.add(leaves);

  return { root, stationHotspots, focusTargets };
}
