import {
  ACESFilmicToneMapping,
  Clock,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  PCFSoftShadowMap,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { CameraRig } from './camera-rig';
import { ChefEngine } from './chef-engine';
import { buildKitchenScenery } from './kitchen-scenery';
import { KitchenStation } from './kitchen-station';

/** Callback emitido cuando el usuario hace clic en una estación. */
export type StationClickHandler = (station: KitchenStation) => void;

/**
 * Motor de la escena `WorldScene.KITCHEN` (Fase 0). Render puro con Three.js:
 * monta la cocina placeholder + el chef, controla la cámara y emite clics de
 * estación. No conoce negocio — el feature decide qué hace cada estación.
 *
 * Ligero por diseño (regla §0 de mundo_3d_assets.md): una sola luz direccional
 * con sombras, materiales planos, mínimo de mallas.
 */
export class KitchenEngine {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly rig: CameraRig;
  private readonly chef: ChefEngine;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly clock = new Clock();

  private readonly stationHotspots: Mesh[];
  private readonly focusTargets: Map<KitchenStation, Vector3>;

  private clickHandler: StationClickHandler | null = null;
  private frameId = 0;
  private disposed = false;
  private paused = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    reducedMotion: boolean,
  ) {
    const { clientWidth: w, clientHeight: h } = canvas;
    const aspect = h > 0 ? w / h : 1;

    this.renderer = new WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene.background = new Color(0xfbf4e9); // crema (surface-page)

    // Luces: cálidas y baratas.
    const hemi = new HemisphereLight(0xfff3df, 0xe8d9c4, 1.1);
    this.scene.add(hemi);

    const sun = new DirectionalLight(0xffe7c2, 1.5);
    sun.position.set(5, 8, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 30;
    sun.shadow.camera.left = -6;
    sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6;
    sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    // Escena placeholder + estaciones.
    const scenery = buildKitchenScenery();
    this.scene.add(scenery.root);
    this.stationHotspots = scenery.stationHotspots;
    this.focusTargets = scenery.focusTargets;

    // Chef, apoyado junto al tablero de recetas, mirando al centro.
    this.chef = new ChefEngine(new Vector3(0.2, 0, 1.4), reducedMotion);
    this.chef.group.rotation.y = -2.4;
    this.scene.add(this.chef.group);

    // Cámara.
    this.rig = new CameraRig(aspect, reducedMotion);

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);

    this.loop();
  }

  /** Registra el handler de clic de estación. */
  onStationClick(handler: StationClickHandler): void {
    this.clickHandler = handler;
  }

  /** Entrada cinematográfica. Resuelve al terminar (o de inmediato si reduced-motion). */
  flyIn(): Promise<void> {
    return this.rig.flyIn();
  }

  /** Acerca la cámara a una estación. */
  focusStation(station: KitchenStation): Promise<void> {
    const target = this.focusTargets.get(station);
    return target ? this.rig.focusStation(target) : Promise.resolve();
  }

  /** Vuelve a la vista general. */
  resetView(): Promise<void> {
    return this.rig.resetView();
  }

  /** Gesto de celebración del chef (cierre de nivel). */
  celebrate(): void {
    this.chef.celebrate();
  }

  /** Detiene el loop de render (p. ej. mientras se abre el libro a pantalla completa). */
  pause(): void {
    if (this.paused || this.disposed) {
      return;
    }
    this.paused = true;
    cancelAnimationFrame(this.frameId);
  }

  /** Reanuda el loop de render tras un {@link pause}. */
  resume(): void {
    if (!this.paused || this.disposed) {
      return;
    }
    this.paused = false;
    this.clock.getDelta(); // descarta el dt acumulado durante la pausa
    this.loop();
  }

  /** Ajusta el render al nuevo tamaño del canvas. */
  resize(width: number, height: number): void {
    if (this.disposed || width === 0 || height === 0) {
      return;
    }
    this.renderer.setSize(width, height, false);
    this.rig.setAspect(width / height);
  }

  /** Libera recursos de WebGL y listeners. */
  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.scene.traverse((obj) => {
      const mesh = obj as Partial<Mesh>;
      mesh.geometry?.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else {
        mat?.dispose();
      }
    });
    this.renderer.dispose();
  }

  private readonly loop = (): void => {
    if (this.disposed || this.paused) {
      return;
    }
    const dt = this.clock.getDelta();
    this.rig.update(dt);
    this.chef.update(dt);
    this.renderer.render(this.scene, this.rig.camera);
    this.frameId = requestAnimationFrame(this.loop);
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    const station = this.pickStation(event);
    if (station && this.clickHandler) {
      this.clickHandler(station);
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    this.canvas.style.cursor = this.pickStation(event) ? 'pointer' : 'default';
  };

  /** Raycast del puntero contra las estaciones; devuelve la golpeada o null. */
  private pickStation(event: PointerEvent): KitchenStation | null {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.rig.camera);
    const hit = this.raycaster.intersectObjects(this.stationHotspots, false)[0];
    return (hit?.object.userData['station'] as KitchenStation | undefined) ?? null;
  }
}
