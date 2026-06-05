import * as THREE from 'three';
import { ModelLoader } from './model-loader';
import { CameraRig } from './camera-rig';
import { buildChef } from './chef-mesh';
import { solid } from './town-layout';

interface KitchenOptions {
  /** false con prefers-reduced-motion: se dibuja a demanda y sin flyIn. */
  animate: boolean;
  onStationClick?: (stationId: string) => void;
}

/** Huella objetivo de la sala (ancho/profundo en unidades de escena). */
const ROOM_FOOTPRINT = 7;

/** Estaciones clicables (id alineado con KitchenStation), de izq. a der. */
const STATIONS = [
  { id: 'recipe', color: 0xc98a12 }, // tablero de recetas
  { id: 'pantry', color: 0x4f8a5b }, // despensa
  { id: 'oven', color: 0xb8472a }, // horno
] as const;

/**
 * Escena de la cocina de casa (WorldScene.KITCHEN). Carga kitchen.glb, mide la
 * sala y coloca TODO relativo a ella (cámara, estaciones, chef), inicia con la
 * cinemática flyIn y mantiene una luz cálida sin zonas negras. El estado del
 * stock se muestra en la UI (overlay/dock).
 */
export class KitchenEngine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2(-9, -9);
  private readonly rig: CameraRig;
  private readonly loader = new ModelLoader();

  private readonly stationMeshes = new Map<string, THREE.Mesh>();
  private chef: THREE.Group | null = null;
  private animationId = 0;
  private readonly removeListeners: () => void;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: KitchenOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene.background = new THREE.Color(0xf3e7d3); // crema cálida, sin vacío oscuro
    this.renderer.setClearColor(0xf3e7d3, 1);

    // FOV bajo → perspectiva aplanada, look isométrico.
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    this.rig = new CameraRig(this.camera, options.animate, {
      pos: new THREE.Vector3(ROOM_FOOTPRINT, ROOM_FOOTPRINT, ROOM_FOOTPRINT),
      look: new THREE.Vector3(0, 1.5, 0),
    });

    this.buildLights();
    void this.loadRoom();

    this.resize();

    const onMove = (e: PointerEvent) => this.updatePointer(e);
    const onClick = (e: PointerEvent) => this.handleClick(e);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onClick);
    this.removeListeners = () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onClick);
    };

    if (options.animate) this.loop();
  }

  /* ---------- construcción ---------- */

  private buildLights(): void {
    this.scene.add(new THREE.AmbientLight(0xfff4e6, 0.65)); // relleno: nada en negro
    this.scene.add(new THREE.HemisphereLight(0xfff3e0, 0xb89b7a, 0.9));
    const sun = new THREE.DirectionalLight(0xffe8c8, 0.85);
    sun.position.set(4, 9, 6);
    this.scene.add(sun);
  }

  private async loadRoom(): Promise<void> {
    let box: THREE.Box3;
    try {
      const room = (await this.loader.loadGlb('assets/kitchen/kitchen.glb')).clone(true);
      ModelLoader.normalize(room, ROOM_FOOTPRINT);
      this.scene.add(room);
      box = new THREE.Box3().setFromObject(room);
    } catch {
      const floor = new THREE.Mesh(new THREE.CircleGeometry(ROOM_FOOTPRINT / 2, 32), solid(0xf0e2cc));
      floor.rotation.x = -Math.PI / 2;
      this.scene.add(floor);
      box = new THREE.Box3(
        new THREE.Vector3(-ROOM_FOOTPRINT / 2, 0, -ROOM_FOOTPRINT / 2),
        new THREE.Vector3(ROOM_FOOTPRINT / 2, 3, ROOM_FOOTPRINT / 2),
      );
    }

    this.layout(box);
    this.renderIfStatic();
  }

  /** Coloca cámara, estaciones y chef en función de la sala medida. */
  private layout(box: THREE.Box3): void {
    const h = Math.max(2, box.max.y);
    const halfX = (box.max.x - box.min.x) / 2 || ROOM_FOOTPRINT / 2;
    const halfZ = (box.max.z - box.min.z) / 2 || ROOM_FOOTPRINT / 2;

    // Estaciones: marcadores pequeños flotando sobre la encimera, dentro de la sala.
    const y = h * 0.52;
    const xs = [-halfX * 0.55, 0, halfX * 0.55];
    STATIONS.forEach((s, i) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.08, 24),
        new THREE.MeshStandardMaterial({ color: s.color, emissive: s.color, emissiveIntensity: 0.4, roughness: 0.5 }),
      );
      mesh.position.set(xs[i], y, -halfZ * 0.45);
      mesh.userData['stationId'] = s.id;
      this.scene.add(mesh);
      this.stationMeshes.set(s.id, mesh);
    });

    // Chef: pequeño, en la esquina frontal izquierda (no tapa el centro).
    const chef = buildChef();
    const chefH = new THREE.Box3().setFromObject(chef).getSize(new THREE.Vector3()).y || 1;
    chef.scale.setScalar((h * 0.22) / chefH);
    chef.position.set(-halfX * 0.78, 0, halfZ + 0.6);
    chef.rotation.y = 0.6;
    this.scene.add(chef);
    this.chef = chef;

    // Cámara isométrica de esquina: en diagonal (+x,+y,+z), elevada ~35°,
    // mirando al centro de la sala. Con la cocina de techo abierto, mira hacia
    // dentro mostrando las dos paredes y los electrodomésticos.
    const look = new THREE.Vector3(0, h * 0.42, 0);
    const dist = Math.max(halfX, halfZ) * 2 + 4.5;
    const home = new THREE.Vector3(
      look.x + dist * 0.58,
      look.y + dist * 0.62,
      look.z + dist * 0.58,
    );
    this.rig.setHome(home, look);
    if (this.options.animate) {
      this.rig.flyThrough([
        { x: home.x, y: h + 22, z: home.z + 8, lookX: 0, lookY: look.y, lookZ: 0, dur: 1.4 },
        { x: home.x, y: home.y + 6, z: home.z + 3, lookX: 0, lookY: look.y, lookZ: 0, dur: 1.1 },
        { x: home.x, y: home.y, z: home.z, lookX: look.x, lookY: look.y, lookZ: look.z, dur: 1.0 },
      ]);
    } else {
      this.camera.position.copy(home);
      this.camera.lookAt(look);
    }
  }

  /** Cinemática de salida (Fase 4): la cámara se eleva hacia la ciudad. */
  flyOut(onDone?: () => void): void {
    this.rig.flyThrough([{ x: 0, y: 30, z: 18, lookX: 0, lookY: 2, lookZ: 0, dur: 1.3 }], onDone);
    if (!this.options.animate) this.renderIfStatic();
  }

  /* ---------- loop & input ---------- */

  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop);
    const t = this.clock.getElapsedTime();

    for (const mesh of this.stationMeshes.values()) {
      mesh.rotation.y = t * 0.6;
    }
    if (this.chef) this.chef.position.y = Math.sin(t * 1.8) * 0.03;
    this.rig.update(t, this.pointer);

    if (!this.rig.tweening) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObjects([...this.stationMeshes.values()], false)[0];
      this.canvas.style.cursor = hit ? 'pointer' : 'default';
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updatePointer(e: PointerEvent): void {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  private handleClick(e: PointerEvent): void {
    if (this.rig.tweening) return;
    this.updatePointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects([...this.stationMeshes.values()], false)[0];
    const id = hit?.object.userData['stationId'] as string | undefined;
    if (id) this.options.onStationClick?.(id);
  }

  private renderIfStatic(): void {
    if (!this.options.animate) this.renderer.render(this.scene, this.camera);
  }

  /* ---------- lifecycle ---------- */

  resize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderIfStatic();
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.removeListeners();
    this.scene.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach(m => m.dispose());
      else material?.dispose();
    });
    this.renderer.dispose();
  }
}
