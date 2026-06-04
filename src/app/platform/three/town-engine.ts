import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { buildChef } from './chef-mesh';

/** Snapshot of one building the 3D town knows how to draw. */
export interface BuildingState {
  id: string;
  /** Accent color (hex int) — used for the plot pad / dock chip. */
  color: number;
  /** FBX model + texture atlas (SimplePoly City). */
  model: { url: string; texture: string };
  /** Operational = open; locked shows a floating padlock (still textured). */
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

/**
 * Plots (x,z), in the order buildings are passed to `update()`
 * (oficina, bodega, tienda, obrador, mercado). A shallow V with the shop
 * (tienda) front-and-center; the rest flank behind, all facing the camera (+z).
 */
const PLOTS: [number, number][] = [
  [-5.2, -2.2], // oficina
  [-2.7, -2.9], // bodega
  [0, 0.2], //     tienda — front center
  [2.7, -2.9], //  obrador
  [5.2, -2.2], //  mercado
];

const PIN_COLOR = { amber: 0xcf9a32, red: 0xbf412c };
const BUILDING_FOOTPRINT = 2.7;
const CAR_FOOTPRINT = 2.2;

const CAMERA_HOME = { x: 0, y: 6.2, z: 13.5 };
const LOOK_HOME = new THREE.Vector3(0, 0.6, 0);

const ROAD_Z = 3;
const SIDEWALK_Z = 1.9;
const EDGE = 8; // cars/people wrap beyond ±EDGE in x

interface BuildingNode {
  group: THREE.Group;
  model: THREE.Object3D | null;
  pins: THREE.Group;
  smoke: THREE.Group | null;
  /** Floating padlock shown while locked. */
  lock: THREE.Sprite | null;
  operational: boolean | null;
  modelRequested: boolean;
}

interface Mover {
  obj: THREE.Object3D;
  dir: number; // +1 / -1 along x
  speed: number;
  baseY: number;
}

/** Eased 0→1 for the cinematic camera dolly. */
function easeInOut(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

/**
 * The town in Three.js: a low-poly street scene (SimplePoly City assets). The
 * shop sits front-and-center; a road crosses the foreground with cars driving
 * and people walking the sidewalk, and the chef waves outside the bakery. Each
 * building is a business domain: clicking it dollies the camera toward its door
 * (`focusBuilding`); `resetView` pulls back. Models load async via FBXLoader.
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
  private readonly templates = new Map<string, Promise<THREE.Object3D>>();

  private readonly nodes = new Map<string, BuildingNode>();
  private readonly decor: THREE.Object3D[] = [];
  private readonly cars: Mover[] = [];
  private readonly people: Mover[] = [];
  private chef: THREE.Group | null = null;
  private chefArm: THREE.Object3D | null = null;
  private particles!: THREE.Points;

  private readonly smokeTexture = this.makeSmokeTexture();
  private readonly lockTexture = this.makeLockTexture();
  private animationId = 0;
  private lastT = 0;
  private hovered: BuildingNode | null = null;
  private readonly removeListeners: () => void;

  private focusedId: string | null = null;
  private readonly look = LOOK_HOME.clone();
  private readonly desiredPos = new THREE.Vector3(CAMERA_HOME.x, CAMERA_HOME.y, CAMERA_HOME.z);
  private readonly desiredLook = LOOK_HOME.clone();
  private camTween: {
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromLook: THREE.Vector3;
    toLook: THREE.Vector3;
    start: number;
    dur: number;
  } | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: EngineOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 140);
    this.camera.position.set(CAMERA_HOME.x, CAMERA_HOME.y, CAMERA_HOME.z);
    this.camera.lookAt(this.look);

    this.buildLights();
    this.buildGround();
    this.buildStreet();
    this.buildDecor();
    this.buildCars();
    this.buildPeople();
    this.buildChef();
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
      new THREE.CylinderGeometry(13, 13.4, 0.6, 14),
      new THREE.MeshStandardMaterial({ color: 0xcde0c2, flatShading: true, roughness: 1 }),
    );
    ground.position.y = -0.3;
    this.scene.add(ground);

    const N = 70;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xe08a52, size: 0.05, transparent: true, opacity: 0.4 }),
    );
    this.scene.add(this.particles);
  }

  /** Road across the foreground + a light sidewalk between road and buildings. */
  private buildStreet(): void {
    const sidewalk = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.14, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xe6dcc7, roughness: 1 }),
    );
    sidewalk.position.set(0, 0.07, SIDEWALK_Z);
    this.scene.add(sidewalk);

    // A row of road tiles forming the street.
    for (let x = -EDGE; x <= EDGE; x += 2) {
      this.loadTemplate('assets/city/road-tile.fbx', 'assets/city/road.png', 2.05).then(t => {
        const tile = t.clone(true);
        tile.position.set(x, 0, ROAD_Z);
        this.scene.add(tile);
        this.requestRender();
      });
    }
  }

  /** Trees and street lights, kept to the back/sides so they don't block the shop. */
  private buildDecor(): void {
    const trees: [string, number, number][] = [
      ['assets/city/tree-fir.fbx', -8.4, -3.6],
      ['assets/city/tree-cube.fbx', 8.4, -3.6],
      ['assets/city/tree-fir.fbx', -7, -5],
      ['assets/city/tree-cube.fbx', 7, -5],
    ];
    for (const [url, x, z] of trees) {
      this.loadTemplate(url, 'assets/city/natures.png', 1.7).then(t => {
        const tree = t.clone(true);
        tree.position.set(x, 0, z);
        tree.rotation.y = Math.random() * Math.PI;
        tree.userData['phase'] = x - z;
        tree.userData['sway'] = 0.02 + Math.random() * 0.025;
        this.scene.add(tree);
        this.decor.push(tree);
        this.requestRender();
      });
    }
    for (const x of [-4.2, 4.2]) {
      this.loadTemplate('assets/city/street-light.fbx', 'assets/city/props.png', 1.9).then(t => {
        const lamp = t.clone(true);
        lamp.position.set(x, 0, SIDEWALK_Z);
        this.scene.add(lamp);
        this.requestRender();
      });
    }
  }

  /** Cars driving along the street in two lanes. */
  private buildCars(): void {
    const fleet: { url: string; tex: string; dir: number; lane: number; speed: number; x: number }[] = [
      { url: 'car', tex: 'car', dir: 1, lane: ROAD_Z - 0.45, speed: 2.2, x: -6 },
      { url: 'suv', tex: 'suv', dir: 1, lane: ROAD_Z - 0.45, speed: 1.7, x: 1 },
      { url: 'taxi', tex: 'taxi', dir: -1, lane: ROAD_Z + 0.45, speed: 2, x: 5 },
      { url: 'car', tex: 'car', dir: -1, lane: ROAD_Z + 0.45, speed: 2.5, x: -2 },
    ];
    for (const c of fleet) {
      this.loadTemplate(`assets/city/${c.url}.fbx`, `assets/city/${c.tex}.png`, CAR_FOOTPRINT).then(t => {
        const car = t.clone(true);
        // Model length runs along x; flip 180° for the −x lane.
        car.rotation.y = c.dir > 0 ? 0 : Math.PI;
        car.position.set(c.x, 0.06, c.lane);
        this.scene.add(car);
        this.cars.push({ obj: car, dir: c.dir, speed: c.speed, baseY: 0.06 });
        this.requestRender();
      });
    }
  }

  /** Low-poly people walking the sidewalk (the pack has no character models). */
  private buildPeople(): void {
    const tones: [number, number][] = [
      [0xbb5530, 0x2a2420],
      [0x4f8a5b, 0x3a2f28],
      [0x3f6f9c, 0x5a4a3a],
      [0xcf9a32, 0x2a2420],
      [0x9a4324, 0x47402f],
      [0x6f9c3f, 0x2a2420],
    ];
    tones.forEach((c, i) => {
      const dir = i % 2 ? -1 : 1;
      const person = this.buildPerson(c[0], c[1]);
      person.position.set(-EDGE + i * 3, 0, SIDEWALK_Z + (i % 2 ? 0.18 : -0.18));
      this.scene.add(person);
      this.people.push({ obj: person, dir, speed: 0.7 + (i % 3) * 0.25, baseY: 0 });
    });
  }

  private buildPerson(shirt: number, pants: number): THREE.Group {
    const g = new THREE.Group();
    const m = (c: number) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9 });
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.55, 6), m(pants));
    legs.position.y = 0.28;
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.6, 6), m(shirt));
    torso.position.y = 0.82;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), m(0xf2c9a0));
    head.position.y = 1.25;
    g.add(legs, torso, head);
    g.scale.setScalar(1.05);
    return g;
  }

  /** The chef stands in front of the bakery (tienda) and waves at the street. */
  private buildChef(): void {
    const chef = buildChef();
    chef.position.set(1.1, 0, 1.5);
    chef.rotation.y = 0.2; // slightly toward the street
    this.chef = chef;
    this.chefArm = chef.getObjectByName('arm') ?? null;
    this.scene.add(chef);
  }

  /* ---------- Buildings ---------- */

  update(buildings: BuildingState[]): void {
    buildings.forEach((data, index) => {
      let node = this.nodes.get(data.id);
      if (!node) {
        node = this.createNode(data, PLOTS[index] ?? [0, 0]);
        this.nodes.set(data.id, node);
      }
      this.ensureModel(node, data);
      node.operational = data.operational;
      // Smoke when operational; padlock when locked.
      if (data.operational && !node.smoke) node.smoke = this.addSmoke(node.group);
      else if (!data.operational && node.smoke) {
        node.group.remove(node.smoke);
        node.smoke = null;
      }
      if (!data.operational && !node.lock) node.lock = this.addLock(node.group);
      else if (data.operational && node.lock) {
        node.group.remove(node.lock);
        node.lock = null;
      }
      this.rebuildPins(node, data);
    });
    this.requestRender();
  }

  private createNode(data: BuildingState, [x, z]: [number, number]): BuildingNode {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.userData['buildingId'] = data.id;

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
    return { group, model: null, pins, smoke: null, lock: null, operational: null, modelRequested: false };
  }

  private ensureModel(node: BuildingNode, data: BuildingState): void {
    if (node.modelRequested) return;
    node.modelRequested = true;
    this.loadTemplate(data.model.url, data.model.texture, BUILDING_FOOTPRINT)
      .then(template => {
        const model = template.clone(true);
        model.traverse(o => (o.userData['buildingId'] = data.id));
        node.model = model;
        node.group.add(model);
        this.requestRender();
      })
      .catch(() => {
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
        if (mesh.isMesh) mesh.material = material;
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

  private rebuildPins(node: BuildingNode, data: BuildingState): void {
    node.pins.clear();
    if (data.alerts <= 0 || !data.alertColor) return;
    const color = PIN_COLOR[data.alertColor];
    const count = Math.min(data.alerts, 3);
    for (let i = 0; i < count; i++) {
      const pin = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.18, 0),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, flatShading: true }),
      );
      pin.position.set((i - (count - 1) / 2) * 0.36, 3.3, 0);
      pin.userData['pin'] = true;
      pin.userData['phase'] = i * 0.7;
      node.pins.add(pin);
    }
  }

  /* ---------- Sprites: smoke + padlock ---------- */

  private makeSmokeTexture(): THREE.Texture {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private makeLockTexture(): THREE.Texture {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.font = '46px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔒', 32, 36);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private addSmoke(group: THREE.Group): THREE.Group {
    const smoke = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const material = new THREE.SpriteMaterial({
        map: this.smokeTexture,
        color: 0xb3aa9b,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const puff = new THREE.Sprite(material);
      const x = (Math.random() - 0.5) * 0.3;
      puff.position.set(x, 1.9, (Math.random() - 0.5) * 0.3);
      puff.userData['baseX'] = x;
      puff.userData['phase'] = i / 6;
      smoke.add(puff);
    }
    group.add(smoke);
    return smoke;
  }

  private addLock(group: THREE.Group): THREE.Sprite {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.lockTexture, transparent: true, depthWrite: false }),
    );
    sprite.scale.setScalar(0.8);
    sprite.position.set(0, 3.3, 0);
    group.add(sprite);
    return sprite;
  }

  /* ---------- Focus / reset ---------- */

  focusBuilding(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;
    this.focusedId = id;
    const { x, z } = node.group.position;
    this.desiredPos.set(x * 0.6, 3.1, z + 6);
    this.desiredLook.set(x, 1, z);
    if (this.options.animate) this.startTween(0.9);
    else this.snapCamera();
  }

  resetView(): void {
    this.focusedId = null;
    this.desiredPos.set(CAMERA_HOME.x, CAMERA_HOME.y, CAMERA_HOME.z);
    this.desiredLook.copy(LOOK_HOME);
    if (this.options.animate) this.startTween(0.8);
    else this.snapCamera();
  }

  private startTween(dur: number): void {
    this.camTween = {
      fromPos: this.camera.position.clone(),
      toPos: this.desiredPos.clone(),
      fromLook: this.look.clone(),
      toLook: this.desiredLook.clone(),
      start: this.clock.getElapsedTime(),
      dur,
    };
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
    if (this.focusedId) return;
    this.updatePointer(e);
    const node = this.pickNode();
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
    const dt = Math.min(0.05, t - this.lastT);
    this.lastT = t;

    this.nodes.forEach(node => {
      node.pins.children.forEach(pin => {
        pin.position.y = 3.3 + Math.sin(t * 2 + (pin.userData['phase'] as number)) * 0.14;
        pin.rotation.y = t * 1.2;
      });
      if (node.smoke) this.animateSmoke(node.smoke, t);
    });
    this.particles.rotation.y = t * 0.02;

    for (const tree of this.decor) {
      const sway = tree.userData['sway'] as number;
      tree.rotation.z = Math.sin(t * 0.8 + (tree.userData['phase'] as number)) * sway;
    }

    // Cars drive; wrap around the edges.
    for (const c of this.cars) {
      c.obj.position.x += c.dir * c.speed * dt;
      if (c.obj.position.x > EDGE) c.obj.position.x = -EDGE;
      else if (c.obj.position.x < -EDGE) c.obj.position.x = EDGE;
    }
    // People walk with a little bob.
    for (const p of this.people) {
      p.obj.position.x += p.dir * p.speed * dt;
      if (p.obj.position.x > EDGE + 1) p.obj.position.x = -EDGE - 1;
      else if (p.obj.position.x < -EDGE - 1) p.obj.position.x = EDGE + 1;
      p.obj.position.y = p.baseY + Math.abs(Math.sin(t * p.speed * 3.5)) * 0.06;
    }
    // Chef waves.
    if (this.chefArm) this.chefArm.rotation.z = 0.7 + Math.sin(t * 5) * 0.3;
    if (this.chef) this.chef.position.y = Math.sin(t * 2) * 0.04;

    this.updateCamera(t);

    if (!this.focusedId && !this.camTween) {
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

  private updateCamera(t: number): void {
    if (this.camTween) {
      const tw = this.camTween;
      const p = Math.min(1, (t - tw.start) / tw.dur);
      const e = easeInOut(p);
      this.camera.position.lerpVectors(tw.fromPos, tw.toPos, e);
      this.look.lerpVectors(tw.fromLook, tw.toLook, e);
      if (p >= 1) this.camTween = null;
    } else if (!this.focusedId) {
      const px = Math.abs(this.pointer.x) <= 1 ? this.pointer.x : 0;
      const py = Math.abs(this.pointer.y) <= 1 ? this.pointer.y : 0;
      const orbit = Math.sin(t * 0.05) * 0.8;
      this.desiredPos.x = CAMERA_HOME.x + orbit + px * 0.7;
      this.desiredPos.y = CAMERA_HOME.y + py * 0.35;
      this.desiredPos.z = CAMERA_HOME.z;
      this.camera.position.lerp(this.desiredPos, 0.05);
      this.look.lerp(this.desiredLook, 0.08);
    } else {
      this.camera.position.set(
        this.desiredPos.x + Math.sin(t * 0.7) * 0.05,
        this.desiredPos.y + Math.sin(t * 0.9) * 0.04,
        this.desiredPos.z,
      );
      this.look.copy(this.desiredLook);
    }
    this.camera.lookAt(this.look);
  }

  private animateSmoke(smoke: THREE.Group, t: number): void {
    smoke.children.forEach(child => {
      const puff = child as THREE.Sprite;
      const phase = puff.userData['phase'] as number;
      const life = (t * 0.35 + phase) % 1;
      puff.position.y = 1.9 + life * 1.6;
      puff.position.x = (puff.userData['baseX'] as number) + Math.sin(life * 6 + phase) * 0.14;
      puff.scale.setScalar(0.3 + life * 0.7);
      (puff.material as THREE.SpriteMaterial).opacity = Math.sin(life * Math.PI) * 0.7;
    });
  }

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
