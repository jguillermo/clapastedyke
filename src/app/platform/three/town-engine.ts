import * as THREE from 'three';
import { CAMERA_HOME, LOOK_HOME } from './town-layout';
import { ModelLoader } from './model-loader';
import { TownScenery } from './town-scenery';
import { TownTraffic } from './town-traffic';
import { TownBuildings, BuildingState } from './town-buildings';
import { CameraRig } from './camera-rig';

/** Public type re-exported so consumers keep importing from `town-engine`. */
export type { BuildingState };

interface EngineOptions {
  /** false with prefers-reduced-motion: frames are drawn on demand. */
  animate: boolean;
  onBuildingClick?: (buildingId: string) => void;
}

/**
 * Orchestrates the town: owns the renderer/scene/camera and wires the focused
 * modules — model loading, static scenery, traffic, interactive buildings and
 * the camera rig — then runs one animation loop and routes pointer input.
 * Each concern lives in its own file; this stays a thin conductor.
 */
export class TownEngine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2(-9, -9);

  private readonly scenery: TownScenery;
  private readonly traffic: TownTraffic;
  private readonly buildings: TownBuildings;
  private readonly rig: CameraRig;

  private animationId = 0;
  private lastT = 0;
  private readonly removeListeners: () => void;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: EngineOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 160);
    this.camera.position.set(CAMERA_HOME.x, CAMERA_HOME.y, CAMERA_HOME.z);
    this.camera.lookAt(LOOK_HOME);

    const invalidate = () => this.renderIfStatic();
    const loader = new ModelLoader();
    this.scenery = new TownScenery(this.scene, loader, invalidate);
    this.traffic = new TownTraffic(this.scene, loader, invalidate);
    this.buildings = new TownBuildings(this.scene, loader, invalidate);
    this.rig = new CameraRig(this.camera, options.animate);

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
    else this.renderer.render(this.scene, this.camera);
  }

  /** Reconcile the buildings with the latest game state. */
  update(buildings: BuildingState[]): void {
    this.buildings.sync(buildings);
  }

  focusBuilding(id: string): void {
    const target = this.buildings.focusTarget(id);
    if (!target) return;
    this.rig.focus(id, target.x, target.z);
    this.renderIfStatic();
  }

  resetView(): void {
    this.rig.reset();
    this.renderIfStatic();
  }

  /* ---------- loop & input ---------- */

  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop);
    const t = this.clock.getElapsedTime();
    const dt = Math.min(0.05, t - this.lastT);
    this.lastT = t;

    this.scenery.animate(t);
    this.traffic.animate(t, dt);
    this.buildings.animate(t);
    this.rig.update(t, this.pointer);

    if (!this.rig.focused && !this.rig.tweening) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const id = this.buildings.raycast(this.raycaster);
      this.buildings.setHovered(id);
      this.canvas.style.cursor = id ? 'pointer' : 'default';
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updatePointer(e: PointerEvent): void {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  private handleClick(e: PointerEvent): void {
    if (this.rig.focused) return;
    this.updatePointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const id = this.buildings.raycast(this.raycaster);
    if (id) this.options.onBuildingClick?.(id);
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
