import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Texture,
} from 'three';
import { createPageCurlMaterial, PageCurlMaterial } from './page-curl.material';

/**
 * Construye el LIBRO ABIERTO con primitivas (sin assets), al estilo de
 * `kitchen-scenery.ts`. Devuelve las piezas que el motor anima.
 *
 * Disposición: lomo en `x = 0`; página izquierda en `x∈[-w,0]`, derecha en
 * `x∈[0,w]`; las caras miran a +Z (hacia la cámara). La hoja que voltea se monta
 * en el lomo y gira de derecha (progress 0) a izquierda (progress 1).
 */

// Tokens Migo (hex) para tapas/lomo/bloque de páginas.
const COLOR = {
  cover: 0x8a4b32, // cacao/terracota — tapa tipo cuero
  coverEdge: 0x6f3b27, // canto de la tapa
  pageBlock: 0xf3e7cf, // canto del taco de páginas
} as const;

/** Dimensiones del libro (unidades de escena). */
export const PAGE_W = 1.0;
export const PAGE_H = 1.4;
const COVER_OVERHANG = 0.04;
const COVER_THICK = 0.05;
const PAGE_GAP = 0.012; // separación de la hoja sobre el taco (evita z-fighting)

/** Piezas del libro que el motor necesita para mostrar/animar. */
export interface BookMesh {
  readonly root: Group;
  /** Armazón del libro abierto (tapa + lomo + bloques). Se oculta en modo single. */
  readonly frame: Group;
  readonly leftPage: Mesh;
  readonly rightPage: Mesh;
  readonly leftMaterial: MeshStandardMaterial;
  readonly rightMaterial: MeshStandardMaterial;
  readonly leaf: Mesh;
  readonly leafCurl: PageCurlMaterial;
  dispose(): void;
}

function pageMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({ roughness: 0.95, metalness: 0 });
}

function matte(color: number): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });
}

export function buildBookMesh(reducedMotion: boolean): BookMesh {
  const root = new Group();

  // Armazón del libro abierto (tapa + lomo + bloques): un grupo que se oculta en
  // modo single para dejar solo la hoja a pantalla completa.
  const frame = new Group();
  root.add(frame);

  // ---- Tapas + lomo (un bloque por debajo de las páginas) ----
  const coverW = PAGE_W * 2 + COVER_OVERHANG * 2;
  const coverH = PAGE_H + COVER_OVERHANG * 2;
  const cover = new Mesh(new BoxGeometry(coverW, coverH, COVER_THICK), matte(COLOR.cover));
  cover.position.set(0, 0, -COVER_THICK / 2 - 0.02);
  cover.castShadow = true;
  cover.receiveShadow = true;
  frame.add(cover);

  // Canto del lomo (resalte central).
  const spine = new Mesh(new BoxGeometry(0.06, coverH, COVER_THICK + 0.02), matte(COLOR.coverEdge));
  spine.position.set(0, 0, -COVER_THICK / 2 - 0.02);
  frame.add(spine);

  // ---- Taco de páginas (da grosor a cada lado) ----
  const block = (signX: number): Mesh => {
    const b = new Mesh(new BoxGeometry(PAGE_W, PAGE_H, 0.03), matte(COLOR.pageBlock));
    b.position.set((signX * PAGE_W) / 2, 0, -0.018);
    b.receiveShadow = true;
    return b;
  };
  frame.add(block(-1), block(1));

  // ---- Páginas estáticas visibles (spread actual) ----
  const leftMaterial = pageMaterial();
  const rightMaterial = pageMaterial();

  const leftGeo = new PlaneGeometry(PAGE_W, PAGE_H);
  leftGeo.translate(-PAGE_W / 2, 0, 0);
  const leftPage = new Mesh(leftGeo, leftMaterial);
  leftPage.position.z = 0;
  leftPage.receiveShadow = true;
  root.add(leftPage);

  const rightGeo = new PlaneGeometry(PAGE_W, PAGE_H);
  rightGeo.translate(PAGE_W / 2, 0, 0);
  const rightPage = new Mesh(rightGeo, rightMaterial);
  rightPage.position.z = 0;
  rightPage.receiveShadow = true;
  root.add(rightPage);

  // ---- Hoja que voltea (malla segmentada con material de curvatura) ----
  const leafGeo = new PlaneGeometry(PAGE_W, PAGE_H, 40, 1);
  leafGeo.translate(PAGE_W / 2, 0, 0); // x∈[0,w], lomo en x=0
  const leafCurl = createPageCurlMaterial(PAGE_W, reducedMotion);
  const leaf = new Mesh(leafGeo, leafCurl.material);
  leaf.position.z = PAGE_GAP;
  leaf.visible = false;
  leaf.castShadow = true;
  root.add(leaf);

  return {
    root,
    frame,
    leftPage,
    rightPage,
    leftMaterial,
    rightMaterial,
    leaf,
    leafCurl,
    dispose(): void {
      root.traverse((obj) => {
        const mesh = obj as Partial<Mesh>;
        mesh.geometry?.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else {
          mat?.dispose();
        }
      });
      leafCurl.dispose();
    },
  };
}
