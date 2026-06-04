import * as THREE from 'three';
import { ModelLoader } from './model-loader';
import { BUILDING_FOOTPRINT, PIN_COLOR, PLOTS, solid } from './town-layout';

/** Snapshot of one building the town draws. */
export interface BuildingState {
  id: string;
  color: number;
  model: { url: string; texture: string };
  operational: boolean;
  alerts: number;
  alertColor: 'amber' | 'red' | null;
}

interface BuildingNode {
  group: THREE.Group;
  pins: THREE.Group;
  smoke: THREE.Group | null;
  lock: THREE.Sprite | null;
  operational: boolean | null;
  modelRequested: boolean;
}

/**
 * The interactive buildings on their plots: loads each model, keeps it textured
 * (locked buildings get a floating padlock, not a grey-out), shows chimney smoke
 * and alert pins, and resolves clicks/hover via raycasting.
 */
export class TownBuildings {
  private readonly nodes = new Map<string, BuildingNode>();
  private readonly smokeTexture = makeSmokeTexture();
  private readonly lockTexture = makeLockTexture();
  private hovered: BuildingNode | null = null;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly loader: ModelLoader,
    private readonly invalidate: () => void,
  ) {}

  /** Reconcile the scene with the latest building states. */
  sync(states: BuildingState[]): void {
    states.forEach((data, i) => {
      let node = this.nodes.get(data.id);
      if (!node) {
        node = this.createNode(data, PLOTS[i] ?? [0, 0]);
        this.nodes.set(data.id, node);
      }
      this.ensureModel(node, data);
      node.operational = data.operational;
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
    this.invalidate();
  }

  animate(t: number): void {
    this.nodes.forEach(node => {
      node.pins.children.forEach(pin => {
        pin.position.y = 3.3 + Math.sin(t * 2 + (pin.userData['phase'] as number)) * 0.14;
        pin.rotation.y = t * 1.2;
      });
      if (node.smoke) animateSmoke(node.smoke, t);
    });
  }

  /** Building id under the ray, or null. */
  raycast(raycaster: THREE.Raycaster): string | null {
    const groups = [...this.nodes.values()].map(n => n.group);
    const hit = raycaster.intersectObjects(groups, true)[0];
    if (!hit) return null;
    let obj: THREE.Object3D | null = hit.object;
    while (obj && obj.userData['buildingId'] === undefined) obj = obj.parent;
    return (obj?.userData['buildingId'] as string | undefined) ?? null;
  }

  /** Lifts the hovered building; returns true if something is hovered. */
  setHovered(id: string | null): boolean {
    const node = id ? (this.nodes.get(id) ?? null) : null;
    if (node === this.hovered) return !!this.hovered;
    this.hovered?.group.scale.setScalar(1);
    this.hovered = node;
    node?.group.scale.setScalar(1.07);
    return !!node;
  }

  /** Plot position the camera should focus on. */
  focusTarget(id: string): { x: number; z: number } | null {
    const node = this.nodes.get(id);
    return node ? { x: node.group.position.x, z: node.group.position.z } : null;
  }

  /* ---------- internals ---------- */

  private createNode(data: BuildingState, [x, z]: [number, number]): BuildingNode {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.userData['buildingId'] = data.id;

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.16, 18), solid(0xbcd6a6));
    pad.position.y = 0.08;
    pad.userData['buildingId'] = data.id;
    group.add(pad);

    const pins = new THREE.Group();
    group.add(pins);

    this.scene.add(group);
    return { group, pins, smoke: null, lock: null, operational: null, modelRequested: false };
  }

  private ensureModel(node: BuildingNode, data: BuildingState): void {
    if (node.modelRequested) return;
    node.modelRequested = true;
    this.loader
      .load(data.model.url, data.model.texture, BUILDING_FOOTPRINT)
      .then(template => {
        const model = template.clone(true);
        model.traverse(o => (o.userData['buildingId'] = data.id));
        node.group.add(model);
        this.invalidate();
      })
      .catch(() => {
        node.modelRequested = false;
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
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, flatShading: true }),
      );
      pin.position.set((i - (count - 1) / 2) * 0.36, 3.3, 0);
      pin.userData['phase'] = i * 0.7;
      node.pins.add(pin);
    }
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
}

/* ---------- sprite textures (module-local) ---------- */

function makeSmokeTexture(): THREE.Texture {
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

function makeLockTexture(): THREE.Texture {
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

function animateSmoke(smoke: THREE.Group, t: number): void {
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
