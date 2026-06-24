import {
  ACESFilmicToneMapping,
  Clock,
  Color,
  DirectionalLight,
  HemisphereLight,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
} from 'three';
import { buildBookMesh, BookMesh, PAGE_H, PAGE_W } from './book-mesh';
import { PageContent } from './page-content';
import { renderPageTexture } from './page-texture';
import { PageTurn } from './page-turn';

/** Spread visible: contenido de la cara izquierda y derecha (null = sin cara). */
export interface BookSpread {
  readonly leafIndex: number;
  readonly totalLeaves: number;
  readonly canPrev: boolean;
  readonly canNext: boolean;
  readonly left: PageContent | null;
  readonly right: PageContent | null;
}

export type SpreadChangeHandler = (spread: BookSpread) => void;

const FOV = 32;
const MARGIN = 0.18; // aire alrededor del libro al encuadrar

/**
 * Motor 3D del LIBRO DE RECETAS (pantalla completa, su propio canvas). Render
 * puro con Three.js, agnóstico de negocio: recibe `PageContent[]` y los dibuja
 * sobre las páginas. Modelo de "hojas": la hoja `k` tiene cara frontal
 * `faces[2k]` y trasera `faces[2k+1]`; el spread abierto en `k` muestra
 * `faces[2k-1]` (izq.) y `faces[2k]` (der.).
 */
export class BookEngine {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly clock = new Clock();
  private readonly book: BookMesh;
  private readonly turn: PageTurn;

  private faces: PageContent[] = [];
  private readonly textures = new Map<number, Texture>();
  private blankTexture: Texture | null = null;

  /** Hojas volteadas hacia la izquierda (0..totalLeaves). */
  private leafIndex = 0;
  private spreadHandler: SpreadChangeHandler | null = null;
  private frameId = 0;
  private disposed = false;
  private aspect = 1;

  /** Cola de volteos pendientes (+1 adelante, -1 atrás) y bandera de drenado. */
  private readonly queue: (1 | -1)[] = [];
  private draining = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly reducedMotion: boolean,
  ) {
    const { clientWidth: w, clientHeight: h } = canvas;
    this.aspect = h > 0 ? w / h : 1;

    this.renderer = new WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene.background = new Color(0xefe3cf); // crema un poco más cálida que la cocina

    const hemi = new HemisphereLight(0xfff3df, 0xe8d9c4, 1.15);
    this.scene.add(hemi);
    const sun = new DirectionalLight(0xffe7c2, 1.35);
    sun.position.set(2.5, 4, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 12;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    this.book = buildBookMesh(reducedMotion);
    this.scene.add(this.book.root);

    this.camera = new PerspectiveCamera(FOV, this.aspect, 0.1, 50);
    this.turn = new PageTurn((p) => this.book.leafCurl.setProgress(p), reducedMotion);

    this.frameCamera();
    this.loop();
  }

  /** Carga (o recarga) las páginas y muestra el primer spread. */
  setPages(pages: PageContent[]): void {
    // Padding a número par de caras: cada hoja necesita frontal + trasera.
    const faces = [...pages];
    if (faces.length % 2 !== 0) {
      faces.push({ kind: 'blank' });
    }
    this.clearTextures();
    this.queue.length = 0;
    this.faces = faces;
    this.leafIndex = 0;
    this.book.leaf.visible = false;
    this.book.leafCurl.setProgress(0);
    this.renderSpread();
    this.emitSpread();
  }

  /** Registra el observador de cambios de spread (para HUD / aria-live). */
  onSpreadChange(handler: SpreadChangeHandler): void {
    this.spreadHandler = handler;
  }

  /** Estado actual del spread. */
  get spread(): BookSpread {
    const total = this.totalLeaves;
    return {
      leafIndex: this.leafIndex,
      totalLeaves: total,
      canPrev: this.leafIndex > 0,
      canNext: this.leafIndex < total,
      left: this.faceAt(2 * this.leafIndex - 1),
      right: this.faceAt(2 * this.leafIndex),
    };
  }

  /**
   * Pide voltear hacia adelante. **No bloquea**: si hay una hoja en curso, la
   * acelera y encola esta, de modo que pulsar rápido pasa varias hojas seguidas
   * (como un libro real). Las hojas encadenadas van más rápido.
   */
  next(): void {
    this.enqueue(1);
  }

  /** Pide voltear hacia atrás (mismo encolado no bloqueante que {@link next}). */
  prev(): void {
    this.enqueue(-1);
  }

  private enqueue(dir: 1 | -1): void {
    this.queue.push(dir);
    this.turn.hurry(); // acelera el volteo en curso para encadenar el siguiente
    if (!this.draining) {
      void this.drain();
    }
  }

  /** Procesa la cola de volteos en serie; acelera si quedan más pendientes. */
  private async drain(): Promise<void> {
    this.draining = true;
    while (this.queue.length > 0) {
      const dir = this.queue.shift() as 1 | -1;
      const fast = this.queue.length > 0; // si vienen más, esta hoja va rápido
      await (dir === 1 ? this.turnForward(fast) : this.turnBackward(fast));
    }
    this.draining = false;
  }

  /** Voltea una hoja hacia adelante (derecha → izquierda). */
  private async turnForward(fast: boolean): Promise<void> {
    if (this.leafIndex >= this.totalLeaves) {
      return;
    }
    const k = this.leafIndex;
    // La hoja k: frontal = cara der. actual, trasera = la que quedará a la izq.
    this.book.leafCurl.setFront(this.textureAt(2 * k));
    this.book.leafCurl.setBack(this.textureAt(2 * k + 1));
    // La nueva página derecha (faces[2k+2]) queda OCULTA bajo la hoja en progreso 0.
    this.setMap(this.book.rightMaterial, this.textureAt(2 * k + 2));
    this.book.leaf.visible = true;

    await this.turn.start(0, 1, fast ? 0.42 : 0.95);

    // La hoja aterriza a la izquierda mostrando su cara trasera.
    this.setMap(this.book.leftMaterial, this.textureAt(2 * k + 1));
    this.book.leaf.visible = false;
    this.leafIndex = k + 1;
    this.emitSpread();
  }

  /** Voltea una hoja hacia atrás (izquierda → derecha). */
  private async turnBackward(fast: boolean): Promise<void> {
    if (this.leafIndex <= 0) {
      return;
    }
    const k = this.leafIndex;
    // Vuelve la hoja (k-1): frontal = faces[2k-2], trasera = faces[2k-1] (izq. actual).
    this.book.leafCurl.setFront(this.textureAt(2 * k - 2));
    this.book.leafCurl.setBack(this.textureAt(2 * k - 1));
    // La página que reaparece a la izquierda (faces[2k-3]) queda oculta bajo la hoja.
    this.setMap(this.book.leftMaterial, this.textureAt(2 * k - 3));
    this.book.leaf.visible = true;

    await this.turn.start(1, 0, fast ? 0.42 : 0.95);

    // La hoja aterriza a la derecha mostrando su cara frontal.
    this.setMap(this.book.rightMaterial, this.textureAt(2 * k - 2));
    this.book.leaf.visible = false;
    this.leafIndex = k - 1;
    this.emitSpread();
  }

  /** Salta sin animación a una hoja (índice de navegación). */
  goToLeaf(index: number): void {
    this.queue.length = 0; // un salto cancela los volteos encolados
    const clamped = Math.max(0, Math.min(index, this.totalLeaves));
    if (clamped === this.leafIndex || this.turn.animating) {
      return;
    }
    this.book.leaf.visible = false;
    this.leafIndex = clamped;
    this.renderSpread();
    this.emitSpread();
  }

  /** Ajusta el render y reencuadra al nuevo tamaño. */
  resize(width: number, height: number): void {
    if (this.disposed || width === 0 || height === 0) {
      return;
    }
    this.aspect = width / height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = this.aspect;
    this.frameCamera();
  }

  /** Libera recursos de WebGL. */
  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    this.clearTextures();
    this.blankTexture?.dispose();
    this.book.dispose();
    this.renderer.dispose();
  }

  // ---------- interno ----------

  private get totalLeaves(): number {
    return this.faces.length / 2;
  }

  private faceAt(index: number): PageContent | null {
    return index >= 0 && index < this.faces.length ? this.faces[index] : null;
  }

  /** Aplica al spread actual las texturas de las caras izquierda/derecha. */
  private renderSpread(): void {
    this.setMap(this.book.leftMaterial, this.textureAt(2 * this.leafIndex - 1));
    this.setMap(this.book.rightMaterial, this.textureAt(2 * this.leafIndex));
  }

  /** Textura de una cara (cacheada). Fuera de rango → textura en blanco. */
  private textureAt(index: number): Texture {
    const content = this.faceAt(index);
    if (!content) {
      this.blankTexture ??= renderPageTexture({ kind: 'blank' });
      return this.blankTexture;
    }
    let tex = this.textures.get(index);
    if (!tex) {
      tex = renderPageTexture(content);
      this.textures.set(index, tex);
    }
    return tex;
  }

  /** Asigna un mapa a un material, recompilando solo al pasar de sin-mapa a con-mapa. */
  private setMap(material: MeshStandardMaterial, texture: Texture): void {
    const hadMap = material.map !== null;
    material.map = texture;
    if (!hadMap) {
      material.needsUpdate = true;
    }
  }

  private emitSpread(): void {
    this.spreadHandler?.(this.spread);
  }

  private clearTextures(): void {
    this.textures.forEach((t) => t.dispose());
    this.textures.clear();
    this.book.leftMaterial.map = null;
    this.book.rightMaterial.map = null;
  }

  /** Encuadra la cámara para que el spread (o una página en retrato) quepa. */
  private frameCamera(): void {
    const portrait = this.aspect < 0.85;
    // En retrato (móvil) enfocamos una página (la derecha, la "activa"); en
    // apaisado, el spread completo.
    const halfW = (portrait ? PAGE_W / 2 : PAGE_W) + MARGIN;
    const halfH = PAGE_H / 2 + MARGIN;
    const targetX = portrait ? PAGE_W / 2 : 0;

    const vFov = (FOV * Math.PI) / 180;
    const distH = halfH / Math.tan(vFov / 2);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.aspect);
    const distW = halfW / Math.tan(hFov / 2);
    const distance = Math.max(distH, distW) * 1.06;

    this.camera.position.set(targetX, 0.18, distance);
    this.camera.lookAt(targetX, 0, 0);
    this.camera.updateProjectionMatrix();
  }

  private readonly loop = (): void => {
    if (this.disposed) {
      return;
    }
    const dt = this.clock.getDelta();
    this.turn.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(this.loop);
  };
}
