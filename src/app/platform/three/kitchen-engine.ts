import * as THREE from 'three';
import { ModelLoader } from './model-loader';
import { CameraRig, CameraPose } from './camera-rig';
import { buildChef } from './chef-mesh';
import { solid } from './town-layout';

interface KitchenOptions {
  /** false con prefers-reduced-motion: se dibuja a demanda y sin flyIn. */
  animate: boolean;
  onStationClick?: (stationId: string) => void;
}

/** Estación clicable de la cocina (id alineado con KitchenStation). */
interface Station {
  id: string;
  color: number;
  pos: THREE.Vector3;
}

const KITCHEN_HOME = {
  pos: new THREE.Vector3(0, 3.2, 7.5),
  look: new THREE.Vector3(0, 1.4, -1),
};

/** Pasos de la cinemática de arranque: ciudad arriba → casa → cocina. */
const FLY_IN: CameraPose[] = [
  { x: 0, y: 26, z: 16, lookX: 0, lookY: 2, lookZ: 0, dur: 1.4 },
  { x: 0, y: 8, z: 11, lookX: 0, lookY: 2, lookZ: -1, dur: 1.2 },
  { x: KITCHEN_HOME.pos.x, y: KITCHEN_HOME.pos.y, z: KITCHEN_HOME.pos.z, lookX: -1, lookY: 1.4, lookZ: -1, dur: 1.0 },
];

const STATIONS: Station[] = [
  { id: 'recipe', color: 0xc98a12, pos: new THREE.Vector3(-2.4, 1.7, -2.4) }, // tablero de recetas
  { id: 'pantry', color: 0x4f8a5b, pos: new THREE.Vector3(0, 1.5, -3.0) }, // despensa
  { id: 'oven', color: 0xb8472a, pos: new THREE.Vector3(2.4, 1.7, -2.4) }, // horno
];

/**
 * Escena de la cocina de casa (WorldScene.KITCHEN). Carga kitchen.glb, coloca
 * al chef y unas estaciones clicables (tablero, despensa, horno) e inicia con
 * la cinemática flyIn. El estado del stock se muestra en la UI (overlay/dock).
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

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    this.rig = new CameraRig(this.camera, options.animate, KITCHEN_HOME);

    this.buildLights();
    this.buildStations();
    this.buildChefMascot();
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

    if (options.animate) {
      this.rig.flyThrough(FLY_IN);
      this.loop();
    } else {
      this.camera.position.copy(KITCHEN_HOME.pos);
      this.camera.lookAt(KITCHEN_HOME.look);
      this.renderer.render(this.scene, this.camera);
    }
  }

  /* ---------- construcción ---------- */

  private buildLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xfff3e0, 0x6b5d52, 1.1));
    const sun = new THREE.DirectionalLight(0xffe8c8, 1.0);
    sun.position.set(4, 9, 6);
    this.scene.add(sun);
  }

  private async loadRoom(): Promise<void> {
    try {
      const room = (await this.loader.loadGlb('assets/kitchen/kitchen.glb')).clone(true);
      ModelLoader.normalize(room, 7);
      this.scene.add(room);
    } catch {
      // Sin el GLB el flujo sigue por la UI; dejamos un suelo simple.
      const floor = new THREE.Mesh(new THREE.CircleGeometry(5, 32), solid(0xf0e2cc));
      floor.rotation.x = -Math.PI / 2;
      this.scene.add(floor);
    }
    this.renderIfStatic();
  }

  private buildStations(): void {
    for (const s of STATIONS) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.18, 24),
        new THREE.MeshStandardMaterial({ color: s.color, emissive: s.color, emissiveIntensity: 0.35, roughness: 0.6 }),
      );
      mesh.position.copy(s.pos);
      mesh.userData['stationId'] = s.id;
      this.scene.add(mesh);
      this.stationMeshes.set(s.id, mesh);
    }
  }

  private buildChefMascot(): void {
    this.chef = buildChef();
    this.chef.position.set(0, 0, 1.4);
    this.scene.add(this.chef);
  }

  /* ---------- loop & input ---------- */

  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop);
    const t = this.clock.getElapsedTime();

    for (const mesh of this.stationMeshes.values()) {
      mesh.position.y += Math.sin(t * 2 + mesh.position.x) * 0.0015;
      mesh.rotation.y = t * 0.6;
    }
    if (this.chef) this.chef.position.y = Math.sin(t * 1.8) * 0.04;
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
