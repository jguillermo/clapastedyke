import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/** Snapshot of one building the 3D town knows how to draw. */
export interface BuildingState {
  id: string;
  /** Accent color (hex int) — used for the locked tint and the plot pad. */
  color: number;
  /** FBX model + texture atlas (SimplePoly City). */
  model: { url: string; texture: string };
  /** Operational = full color model; locked = greyed «under construction». */
  operational: boolean;
  /** Number of attention pins floating above the building. */
  alerts: number;
  /** Color of the pins: warning (amber) or danger (red). */
  alertColor: 'amber' | 'red' | null;
}

interface EngineOptions {
  /** false with prefers-reduced-motion: frames are drawn on demand. */
  animate: boolean;
  onBuildingClick?: (buildingId: string) => void;
}

/** Plots on the ground, in the order buildings are passed to `update()`. */
const PLOTS: [number, number][] = [
  [-4.2, 0.4], // 0
  [-2.1, -1.6], // 1
  [0, 1.6], // 2 — center front, the storefront
  [2.1, -1.6], // 3
  [4.2, 0.4], // 4
];

const LOCKED_COLOR = 0xb4aa9c;
const PIN_COLOR = { amber: 0xcf9a32, red: 0xbf412c };
const BUILDING_FOOTPRINT = 2.7;

const CAMERA_HOME = { x: 0, y: 5.6, z: 10.6 };
const LOOK_HOME = new THREE.Vector3(0, 0.8, 0);

interface BuildingNode {
  /** Container placed on its plot; carries the building id for raycasting. */
  group: THREE.Group;
  /** Loaded model root (added once). */
  model: THREE.Object3D | null;
  /** Holder for the floating alert pins (rebuilt on state change). */
  pins: THREE.Group;
  operational: boolean | null;
  modelRequested: boolean;
}

/**
 * The town in Three.js: a small low-poly city (SimplePoly City assets) where
 * each building is a domain of the pastry shop. The camera orbits softly (hub);
 * clicking a building dollies the camera toward its door (`focusBuilding`) so
 * the overlay can open over it, and `resetView` pulls back to the town.
 *
 * Models load asynchronously via FBXLoader; a plot pad keeps the layout visible
 * until each one arrives. Same lifecycle discipline as `world-engine.ts`.
 */
export class TownEngine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2(-9, -9);

  private readonly fbx = new FBXLoader();
  private readonly textures = new THREE.TextureLoader();
  /** Cache of normalized model templates by url (cloned per building). */
  private readonly templates = new Map<string, Promise<THREE.Object3D>>();
  private readonly lockedMaterial = new THREE.MeshStandardMaterial({
    color: LOCKED_COLOR,
    roughness: 1,
    flatShading: true,
  });

  private readonly nodes = new Map<string, BuildingNode>();
  private particles!: THREE.Points;
  private animationId = 0;
  private hovered: BuildingNode | null = null;
  private readonly removeListeners: () => void;

  private focusedId: string | null = null;
  private readonly look = LOOK_HOME.clone();
  private readonly desiredPos = new THREE.Vector3(CAMERA_HOME.x, CAMERA_HOME.y, CAMERA_HOME.z);
  private readonly desiredLook = LOOK_HOME.clone();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: EngineOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    this.camera.position.set(CAMERA_HOME.x, CAMERA_HOME.y, CAMERA_HOME.z);
    this.camera.lookAt(this.look);

    this.buildLights();
    this.buildGround();
    this.buildDecor();
    this.resize();

    const onMove = (e: PointerEvent) => this.updatePointer(e);
    const onClick = (e: PointerEvent) => this.handleClick(e);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onClick);
    this.removeListeners = () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onClick);
    };

    if (this.options.animate) this.loop();
    else this.renderer.render(this.scene, this.camera);
  }

  /* ---------- Construction ---------- */

  private buildLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xfff6ea, 0xcebfa6, 1.15));
    const sun = new THREE.DirectionalLight(0xffe7cd, 1.7);
    sun.position.set(5, 10, 6);
    this.scene.add(sun);
  }

  private buildGround(): void {
    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(9.5, 9.9, 0.6, 12),
      new THREE.MeshStandardMaterial({ color: 0xcde0c2, flatShading: true, roughness: 1 }),
    );
    ground.position.y = -0.3;
    this.scene.add(ground);

    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 0.05, 28),
      new THREE.MeshStandardMaterial({ color: 0xe6dcc7, roughness: 1 }),
    );
    plaza.position.y = 0.005;
    this.scene.add(plaza);

    const N = 90;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xe08a52, size: 0.05, transparent: true, opacity: 0.45 }),
    );
    this.scene.add(this.particles);
  }

  /** Trees and street lights scattered around the plaza (non-interactive). */
  private buildDecor(): void {
    const trees: [string, number, number][] = [
      ['assets/city/tree-fir.fbx', -6.4, -3],
      ['assets/city/tree-cube.fbx', 6.4, -3],
      ['assets/city/tree-fir.fbx', -7, 2.4],
      ['assets/city/tree-cube.fbx', 7, 2.4],
      ['assets/city/tree-fir.fbx', 0, -4.2],
    ];
    for (const [url, x, z] of trees) {
      this.loadTemplate(url, 'assets/city/natures.png', 1.7).then(t => {
        const tree = t.clone(true);
        tree.position.set(x, 0, z);
        tree.rotation.y = Math.random() * Math.PI;
        this.scene.add(tree);
        this.requestRender();
      });
    }
    const lights: [number, number][] = [
      [-2.6, 2],
      [2.6, 2],
    ];
    for (const [x, z] of lights) {
      this.loadTemplate('assets/city/street-light.fbx', 'assets/city/props.png', 1.9).then(t => {
        const lamp = t.clone(true);
        lamp.position.set(x, 0, z);
        this.scene.add(lamp);
        this.requestRender();
      });
    }
  }

  /**
   * Syncs the buildings onto the scene. The set is stable (5 fixed ids), so we
   * create each node once and only update its locked tint and alert pins after.
   */
  update(buildings: BuildingState[]): void {
    buildings.forEach((data, index) => {
      let node = this.nodes.get(data.id);
      if (!node) {
        node = this.createNode(data, PLOTS[index] ?? [0, 0]);
        this.nodes.set(data.id, node);
      }
      this.ensureModel(node, data);
      if (node.operational !== data.operational) {
        node.operational = data.operational;
        this.applyLockTint(node, data.operational);
      }
      this.rebuildPins(node, data);
    });
    this.requestRender();
  }

  private createNode(data: BuildingState, [x, z]: [number, number]): BuildingNode {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.userData['buildingId'] = data.id;

    // Plot pad — visible immediately while the model loads.
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.6, 0.16, 18),
      new THREE.MeshStandardMaterial({ color: 0xe6dcc7, roughness: 1 }),
    );
    pad.position.y = 0.08;
    pad.userData['buildingId'] = data.id;
    group.add(pad);

    const pins = new THREE.Group();
    group.add(pins);

    this.scene.add(group);
    return { group, model: null, pins, operational: null, modelRequested: false };
  }

  private ensureModel(node: BuildingNode, data: BuildingState): void {
    if (node.modelRequested) return;
    node.modelRequested = true;
    this.loadTemplate(data.model.url, data.model.texture, BUILDING_FOOTPRINT)
      .then(template => {
        const model = template.clone(true);
        model.userData['buildingId'] = data.id;
        model.traverse(o => (o.userData['buildingId'] = data.id));
        node.model = model;
        node.group.add(model);
        if (node.operational === false) this.applyLockTint(node, false);
        this.requestRender();
      })
      .catch(() => {
        /* keep the plot pad if the model fails to load */
        node.modelRequested = false;
      });
  }

  /** Loads, textures and normalizes an FBX once; cached and cloned per use. */
  private loadTemplate(url: string, textureUrl: string, footprint: number): Promise<THREE.Object3D> {
    const cached = this.templates.get(url);
    if (cached) return cached;

    const promise = this.fbx.loadAsync(url).then(obj => {
      const texture = this.textures.load(textureUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 });
      obj.traverse(child => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.material = material;
          mesh.userData['textured'] = material;
        }
      });
      this.normalize(obj, footprint);
      return obj;
    });
    this.templates.set(url, promise);
    return promise;
  }

  /** Scales an object to a target footprint and sits it on the ground, centered. */
  private normalize(obj: THREE.Object3D, footprint: number): void {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const maxXZ = Math.max(size.x, size.z) || 1;
    obj.scale.setScalar(footprint / maxXZ);

    const box2 = new THREE.Box3().setFromObject(obj);
    const center = box2.getCenter(new THREE.Vector3());
    obj.position.x -= center.x;
    obj.position.z -= center.z;
    obj.position.y -= box2.min.y;
  }

  /** Grey out (locked) or restore the textured material (operational). */
  private applyLockTint(node: BuildingNode, operational: boolean): void {
    node.model?.traverse(child => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const textured = mesh.userData['textured'] as THREE.Material | undefined;
      if (textured) mesh.material = operational ? textured : this.lockedMaterial;
    });
  }

  private rebuildPins(node: BuildingNode, data: BuildingState): void {
    node.pins.clear();
    if (data.alerts <= 0 || !data.alertColor) return;
    const color = PIN_COLOR[data.alertColor];
    const count = Math.min(data.alerts, 3);
    for (let i = 0; i < count; i++) {
      const pin = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.18, 0),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.6,
          flatShading: true,
        }),
      );
      pin.position.set((i - (count - 1) / 2) * 0.36, 3.2, 0);
      pin.userData['pin'] = true;
      pin.userData['phase'] = i * 0.7;
      node.pins.add(pin);
    }
  }

  /* ---------- Focus / reset (the «zoom» into a building) ---------- */

  focusBuilding(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;
    this.focusedId = id;
    const { x, z } = node.group.position;
    this.desiredPos.set(x * 0.6, 2.9, z + 5);
    this.desiredLook.set(x, 1, z);
    if (!this.options.animate) this.snapCamera();
  }

  resetView(): void {
    this.focusedId = null;
    this.desiredPos.set(CAMERA_HOME.x, CAMERA_HOME.y, CAMERA_HOME.z);
    this.desiredLook.copy(LOOK_HOME);
    if (!this.options.animate) this.snapCamera();
  }

  private snapCamera(): void {
    this.camera.position.copy(this.desiredPos);
    this.look.copy(this.desiredLook);
    this.camera.lookAt(this.look);
    this.requestRender();
  }

  /* ---------- Interaction ---------- */

  private updatePointer(e: PointerEvent): void {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  private nodeUnder(e: PointerEvent): BuildingNode | null {
    this.updatePointer(e);
    return this.pickNode();
  }

  /** Raycast the building groups (recursive) and resolve the owning node. */
  private pickNode(): BuildingNode | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const groups = [...this.nodes.values()].map(n => n.group);
    const hit = this.raycaster.intersectObjects(groups, true)[0];
    if (!hit) return null;
    let obj: THREE.Object3D | null = hit.object;
    while (obj && obj.userData['buildingId'] === undefined) obj = obj.parent;
    const id = obj?.userData['buildingId'] as string | undefined;
    return id ? (this.nodes.get(id) ?? null) : null;
  }

  private handleClick(e: PointerEvent): void {
    if (this.focusedId) return; // ignore clicks while zoomed in
    const node = this.nodeUnder(e);
    const id = node?.group.userData['buildingId'] as string | undefined;
    if (id) this.options.onBuildingClick?.(id);
  }

  /* ---------- Loop ---------- */

  private requestRender(): void {
    if (!this.options.animate) this.renderer.render(this.scene, this.camera);
  }

  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop);
    const t = this.clock.getElapsedTime();

    this.nodes.forEach(node => {
      node.pins.children.forEach(pin => {
        pin.position.y = 3.2 + Math.sin(t * 2 + (pin.userData['phase'] as number)) * 0.14;
        pin.rotation.y = t * 1.2;
      });
    });
    this.particles.rotation.y = t * 0.02;

    if (!this.focusedId) {
      // Parallax only when the pointer is actually over the canvas; the
      // off-canvas sentinel (-9,-9) must not drag the camera away.
      const px = Math.abs(this.pointer.x) <= 1 ? this.pointer.x : 0;
      const py = Math.abs(this.pointer.y) <= 1 ? this.pointer.y : 0;
      const orbit = Math.sin(t * 0.05) * 1.4;
      this.desiredPos.x = CAMERA_HOME.x + orbit + px * 0.9;
      this.desiredPos.y = CAMERA_HOME.y + py * 0.4;
      this.desiredPos.z = CAMERA_HOME.z;
    }
    this.camera.position.lerp(this.desiredPos, 0.05);
    this.look.lerp(this.desiredLook, 0.08);
    this.camera.lookAt(this.look);

    if (!this.focusedId) {
      const node = this.pickNode();
      if (node !== this.hovered) {
        this.hovered?.group.scale.setScalar(1);
        this.hovered = node;
        node?.group.scale.setScalar(1.07);
        this.canvas.style.cursor = node ? 'pointer' : 'default';
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  /* ---------- Lifecycle ---------- */

  resize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.requestRender();
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.removeListeners();
    this.scene.traverse(obj => this.disposeMeshes(obj));
    this.renderer.dispose();
  }

  private disposeMeshes(obj: THREE.Object3D): void {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) material.forEach(m => m.dispose());
    else material?.dispose();
  }
}
