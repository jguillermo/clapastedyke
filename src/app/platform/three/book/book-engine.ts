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

/** Modo de presentación: spread (dos páginas, escritorio) o single (una, móvil). */
export type BookMode = 'spread' | 'single';

const FOV = 32;
const MARGIN = 0.18; // aire alrededor del libro al encuadrar (spread)
const SINGLE_MARGIN = 0.04; // en single la hoja llena casi todo el ancho (al borde)
/** Por debajo de este aspect (alto/estrecho) o ancho se pasa a una sola página. */
const SINGLE_ASPECT = 1.0;
const SINGLE_WIDTH = 700;

/**
 * Duración (segundos) del volteo de hoja. Sube/baja estos valores para ajustar la
 * velocidad de la animación: `TURN_DURATION` es el volteo normal y
 * `TURN_DURATION_FAST` el de cuando se encadenan varias hojas seguidas (más rápido).
 */
const TURN_DURATION = 0.5;
const TURN_DURATION_FAST = 0.24;

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
  /** Última cara con contenido real (antes del relleno a par). */
  private lastContentFace = 0;
  private readonly textures = new Map<number, Texture>();
  private blankTexture: Texture | null = null;

  /** Hojas volteadas hacia la izquierda (0..totalLeaves). Fuente de verdad en modo spread. */
  private leafIndex = 0;
  /** Cara activa (0..lastContentFace). Fuente de verdad en modo single. */
  private faceIndex = 0;
  private mode: BookMode = 'spread';
  private spreadHandler: SpreadChangeHandler | null = null;
  /** Id del rAF en curso; `0` = en reposo (no se dibuja salvo bajo demanda). */
  private frameId = 0;
  private disposed = false;
  private aspect = 1;
  private widthPx = 1;

  /** Cola de volteos pendientes (+1 adelante, -1 atrás) y bandera de drenado. */
  private readonly queue: (1 | -1)[] = [];
  private draining = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly reducedMotion: boolean,
  ) {
    const { clientWidth: w, clientHeight: h } = canvas;
    this.aspect = h > 0 ? w / h : 1;
    this.widthPx = w;

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

    this.mode = this.computeMode();
    this.book.root.position.x = this.mode === 'single' ? -PAGE_W / 2 : 0;
    this.frameCamera();
    this.requestRender();
  }

  /** Carga (o recarga) las páginas y muestra el primer spread/página. */
  setPages(pages: PageContent[]): void {
    // Padding a número par de caras: cada hoja necesita frontal + trasera.
    const faces = [...pages];
    this.lastContentFace = Math.max(0, faces.length - 1);
    if (faces.length % 2 !== 0) {
      faces.push({ kind: 'blank' });
    }
    this.clearTextures();
    this.queue.length = 0;
    this.faces = faces;
    this.leafIndex = 0;
    this.faceIndex = 0;
    this.mode = this.computeMode();
    this.book.root.position.x = this.mode === 'single' ? -PAGE_W / 2 : 0;
    // En single solo queda la hoja centrada: ocultamos el armazón y la página izquierda.
    this.book.frame.visible = this.mode !== 'single';
    this.book.leftPage.visible = this.mode !== 'single';
    this.book.leaf.visible = false;
    this.book.leafCurl.setProgress(0);
    this.frameCamera();
    this.renderCurrent();
    this.emitSpread();
    this.requestRender();
  }

  /** Registra el observador de cambios de spread (para HUD / aria-live). */
  onSpreadChange(handler: SpreadChangeHandler): void {
    this.spreadHandler = handler;
  }

  /** Estado actual del spread/página (lo consume el HUD). */
  get spread(): BookSpread {
    const total = this.totalLeaves;
    if (this.mode === 'single') {
      return {
        leafIndex: this.leafFromFace(this.faceIndex),
        totalLeaves: total,
        canPrev: this.faceIndex > 0,
        canNext: this.faceIndex < this.lastContentFace,
        left: null,
        right: this.faceAt(this.faceIndex),
      };
    }
    return {
      leafIndex: this.leafIndex,
      totalLeaves: total,
      canPrev: this.leafIndex > 0,
      canNext: this.leafIndex < total,
      left: this.faceAt(2 * this.leafIndex - 1),
      right: this.faceAt(2 * this.leafIndex),
    };
  }

  /** Cara activa actual (ancla de lectura, válida en ambos modos). */
  get currentFaceIndex(): number {
    return this.mode === 'single' ? this.faceIndex : 2 * this.leafIndex;
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
    this.ensureLoop(); // dibuja bajo demanda mientras dure el drenado
    while (this.queue.length > 0) {
      const dir = this.queue.shift() as 1 | -1;
      const fast = this.queue.length > 0; // si vienen más, esta hoja va rápido
      if (this.mode === 'single') {
        await (dir === 1 ? this.turnForwardSingle(fast) : this.turnBackwardSingle(fast));
      } else {
        await (dir === 1 ? this.turnForward(fast) : this.turnBackward(fast));
      }
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

    await this.turn.start(0, 1, fast ? TURN_DURATION_FAST : TURN_DURATION);
    if (this.disposed || this.mode !== 'spread') {
      return; // un cambio de modo/destrucción canceló el volteo: no toques el cursor
    }

    // La hoja aterriza a la izquierda mostrando su cara trasera.
    this.setMap(this.book.leftMaterial, this.textureAt(2 * k + 1));
    this.book.leaf.visible = false;
    this.leafIndex = k + 1;
    this.emitSpread();
    this.requestRender();
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

    await this.turn.start(1, 0, fast ? TURN_DURATION_FAST : TURN_DURATION);
    if (this.disposed || this.mode !== 'spread') {
      return;
    }

    // La hoja aterriza a la derecha mostrando su cara frontal.
    this.setMap(this.book.rightMaterial, this.textureAt(2 * k - 2));
    this.book.leaf.visible = false;
    this.leafIndex = k - 1;
    this.emitSpread();
    this.requestRender();
  }

  /** Voltea UNA página hacia adelante (modo single): la cara actual barre a la izquierda. */
  private async turnForwardSingle(fast: boolean): Promise<void> {
    if (this.faceIndex >= this.lastContentFace) {
      return;
    }
    const f = this.faceIndex;
    // El destino (f+1) queda centrado, oculto bajo la hoja en progreso 0.
    this.setMap(this.book.rightMaterial, this.textureAt(f + 1));
    // La hoja lleva la cara que dejamos (misma cara en ambas caras del papel).
    this.book.leafCurl.setFront(this.textureAt(f));
    this.book.leafCurl.setBack(this.textureAt(f));
    this.book.leaf.visible = true;

    await this.turn.start(0, 1, fast ? TURN_DURATION_FAST : TURN_DURATION);
    if (this.disposed || this.mode !== 'single') {
      return;
    }

    this.book.leaf.visible = false;
    this.faceIndex = f + 1;
    this.emitSpread();
    this.requestRender();
  }

  /** Voltea UNA página hacia atrás (modo single): la cara anterior barre desde la izquierda. */
  private async turnBackwardSingle(fast: boolean): Promise<void> {
    if (this.faceIndex <= 0) {
      return;
    }
    const f = this.faceIndex;
    // La hoja que vuelve lleva el destino (f-1); la actual (f) queda debajo.
    this.book.leafCurl.setFront(this.textureAt(f - 1));
    this.book.leafCurl.setBack(this.textureAt(f - 1));
    this.setMap(this.book.rightMaterial, this.textureAt(f));
    this.book.leaf.visible = true;

    await this.turn.start(1, 0, fast ? TURN_DURATION_FAST : TURN_DURATION);
    if (this.disposed || this.mode !== 'single') {
      return;
    }

    this.setMap(this.book.rightMaterial, this.textureAt(f - 1));
    this.book.leaf.visible = false;
    this.faceIndex = f - 1;
    this.emitSpread();
    this.requestRender();
  }

  /** Salta sin animación a una hoja (modo spread). */
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
    this.requestRender();
  }

  /** Salta sin animación a una cara concreta (respeta el modo actual). */
  jumpToFace(face: number): void {
    if (this.turn.animating) {
      return;
    }
    if (this.mode === 'single') {
      this.queue.length = 0;
      const clamped = Math.max(0, Math.min(face, this.lastContentFace));
      if (clamped === this.faceIndex) {
        return;
      }
      this.book.leaf.visible = false;
      this.faceIndex = clamped;
      this.renderCurrent();
      this.emitSpread();
      this.requestRender();
    } else {
      this.goToLeaf(this.leafFromFace(face));
    }
  }

  /** Salta a la primera página. */
  home(): void {
    this.mode === 'single' ? this.jumpToFace(0) : this.goToLeaf(0);
  }

  /** Salta a la última página con contenido. */
  end(): void {
    this.mode === 'single' ? this.jumpToFace(this.lastContentFace) : this.goToLeaf(this.totalLeaves);
  }

  /** Ajusta el render y reencuadra (cambiando de modo si cruza el breakpoint). */
  resize(width: number, height: number): void {
    if (this.disposed || width === 0 || height === 0) {
      return;
    }
    this.aspect = width / height;
    this.widthPx = width;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = this.aspect;
    const next = this.computeMode();
    if (next !== this.mode) {
      this.applyMode(next);
    } else {
      this.frameCamera();
    }
    this.requestRender();
  }

  /** Libera recursos de WebGL. */
  dispose(): void {
    this.disposed = true;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }
    this.turn.cancel(); // desbloquea cualquier `drain()` en curso
    this.clearTextures();
    this.blankTexture?.dispose();
    this.book.dispose();
    this.renderer.dispose();
  }

  // ---------- interno ----------

  private get totalLeaves(): number {
    return this.faces.length / 2;
  }

  /** Modo según el viewport: una página en estrecho/retrato, spread en ancho. */
  private computeMode(): BookMode {
    return this.aspect < SINGLE_ASPECT || this.widthPx < SINGLE_WIDTH ? 'single' : 'spread';
  }

  /** Hoja (modo spread) que contiene una cara dada. */
  private leafFromFace(face: number): number {
    const leaf = face % 2 === 0 ? face / 2 : (face + 1) / 2;
    return Math.max(0, Math.min(leaf, this.totalLeaves));
  }

  /**
   * Cambia de modo conservando la posición de lectura: remapea el cursor,
   * desplaza el libro para centrar la página (single) o el lomo (spread),
   * y re-renderiza el estado asentado. Cancela cola y volteo en curso.
   */
  private applyMode(next: BookMode): void {
    if (next === this.mode) {
      return;
    }
    this.queue.length = 0;
    if (this.turn.animating) {
      this.turn.cancel();
    }
    if (next === 'single') {
      this.faceIndex = Math.max(0, Math.min(2 * this.leafIndex, this.lastContentFace));
      this.book.root.position.x = -PAGE_W / 2;
    } else {
      this.leafIndex = this.leafFromFace(this.faceIndex);
      this.book.root.position.x = 0;
    }
    this.mode = next;
    this.book.frame.visible = next !== 'single';
    this.book.leftPage.visible = next !== 'single';
    this.book.leaf.visible = false;
    this.book.leafCurl.setProgress(0);
    this.renderCurrent();
    this.frameCamera();
    this.emitSpread();
    this.requestRender();
  }

  private faceAt(index: number): PageContent | null {
    return index >= 0 && index < this.faces.length ? this.faces[index] : null;
  }

  /** Pinta el estado asentado actual según el modo. */
  private renderCurrent(): void {
    if (this.mode === 'single') {
      this.setMap(this.book.rightMaterial, this.textureAt(this.faceIndex));
    } else {
      this.renderSpread();
    }
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

  /** Encuadra la cámara según el modo. En single el libro se desplaza para
   * centrar la página en world x=0; en spread se ve el lomo centrado. */
  private frameCamera(): void {
    const single = this.mode === 'single';
    const margin = single ? SINGLE_MARGIN : MARGIN;
    const halfW = (single ? PAGE_W / 2 : PAGE_W) + margin;
    const halfH = PAGE_H / 2 + margin;
    const targetX = 0;

    const vFov = (FOV * Math.PI) / 180;
    const distH = halfH / Math.tan(vFov / 2);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.aspect);
    const distW = halfW / Math.tan(hFov / 2);
    const distance = Math.max(distH, distW) * (single ? 1.01 : 1.06);

    this.camera.position.set(targetX, 0.18, distance);
    this.camera.lookAt(targetX, 0, 0);
    this.camera.updateProjectionMatrix();
  }

  /** Dibuja un único cuadro (render bajo demanda; escena estática en reposo). */
  private requestRender(): void {
    if (this.disposed) {
      return;
    }
    this.renderer.render(this.scene, this.camera);
  }

  /** Arranca el loop solo mientras se drenan volteos y no corre ya (idempotente). */
  private ensureLoop(): void {
    if (this.disposed || this.frameId || !this.draining) {
      return;
    }
    this.clock.getDelta(); // descarta el delta acumulado en reposo
    this.frameId = requestAnimationFrame(this.loop);
  }

  private readonly loop = (): void => {
    if (this.disposed) {
      this.frameId = 0;
      return;
    }
    const dt = this.clock.getDelta();
    this.turn.update(dt);
    this.renderer.render(this.scene, this.camera);
    // Seguimos mientras se drenen volteos o haya uno activo; si no, paramos.
    this.frameId = this.draining || this.turn.animating ? requestAnimationFrame(this.loop) : 0;
  };
}
