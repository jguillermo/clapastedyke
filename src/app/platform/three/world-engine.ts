import * as THREE from 'three';

/** Snapshot of the game state that the 3D world knows how to draw. */
export interface IslandState {
  id: string;
  missions: MissionState[];
}

export interface MissionState {
  id: string;
  state: 'locked' | 'unlocked' | 'complete';
  /** The mission of the current step: it wears the pulsing ring. */
  current: boolean;
}

interface EngineOptions {
  /** false with prefers-reduced-motion: a single frame is drawn. */
  animate: boolean;
  onMissionClick?: (missionId: string) => void;
}

const ISLAND_COLOR: Record<string, number> = {
  basic: 0xeac9a8,
  intermediate: 0xc9dcc0,
  advanced: 0xc4d1e3,
};

const NODE_COLOR = {
  locked: 0xbdb3a6,
  unlocked: 0xbb5530,
  complete: 0x4f8a5b,
};

/**
 * The game world in Three.js: three islands (one per level) joined by a
 * path, with one node per mission that lights up as it unlocks.
 * Pure class, no Angular: the component creates it outside NgZone.
 */
export class WorldEngine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2(-9, -9);

  private nodes: THREE.Mesh[] = [];
  private islands: THREE.Group[] = [];
  private ring!: THREE.Mesh;
  private particles!: THREE.Points;
  private animationId = 0;
  private nodeUnderPointer: THREE.Mesh | null = null;
  private readonly removeListeners: () => void;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: EngineOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    this.camera.position.set(0, 5.4, 11.5);
    this.camera.lookAt(0, 0.2, 0);

    this.buildLights();
    this.buildWorld();
    this.resize();

    const onMove = (e: PointerEvent) => this.updatePointer(e);
    const onClick = (e: PointerEvent) => this.handleClick(e);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onClick);
    this.removeListeners = () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onClick);
    };

    if (this.options.animate) {
      this.loop();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /* ---------- Construction ---------- */

  private buildLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xfff6ea, 0xd8c9b4, 1.25));
    const sun = new THREE.DirectionalLight(0xffe7cd, 1.6);
    sun.position.set(4, 8, 6);
    this.scene.add(sun);
  }

  private buildWorld(): void {
    // Path joining the islands
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.6, -0.1, 0.6),
      new THREE.Vector3(0, -0.1, -0.7),
      new THREE.Vector3(4.6, -0.1, 0.6),
    ]);
    const path = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 40, 0.06, 6),
      new THREE.MeshStandardMaterial({ color: 0xd9c8ae, roughness: 1 }),
    );
    this.scene.add(path);

    // Ring that pulses over the current mission
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.26, 0.34, 32),
      new THREE.MeshBasicMaterial({ color: 0xe08a52, transparent: true, side: THREE.DoubleSide }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.visible = false;
    this.scene.add(this.ring);

    // Ambient particles floating slowly
    const N = 130;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = Math.random() * 6 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xe08a52, size: 0.06, transparent: true, opacity: 0.55 }),
    );
    this.scene.add(this.particles);
  }

  /**
   * (Re)draws the islands and nodes from the game state.
   * It is idempotent: called at startup and every time progress changes.
   */
  update(islands: IslandState[]): void {
    this.islands.forEach(island => {
      this.scene.remove(island);
      this.disposeObject(island);
    });
    this.islands = [];
    this.nodes = [];
    this.ring.visible = false;

    const spacing = 4.6;
    islands.forEach((data, index) => {
      const group = new THREE.Group();
      group.position.x = (index - (islands.length - 1) / 2) * spacing;
      group.position.z = index === 1 ? -0.7 : 0.6;
      group.userData['phase'] = index * 1.7;

      // Island: faceted disc with the level color
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(1.9, 2.2, 0.55, 9),
        new THREE.MeshStandardMaterial({
          color: ISLAND_COLOR[data.id] ?? 0xeac9a8,
          flatShading: true,
          roughness: 0.9,
        }),
      );
      disc.position.y = -0.28;
      group.add(disc);

      // Mission nodes arranged in an arc over the island
      const n = data.missions.length;
      data.missions.forEach((mission, j) => {
        const angle = (j / Math.max(1, n - 1)) * Math.PI * 0.9 + Math.PI * 0.05;
        const node = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.18, 1),
          new THREE.MeshStandardMaterial({
            color: NODE_COLOR[mission.state],
            flatShading: true,
            emissive: mission.state === 'locked' ? 0x000000 : NODE_COLOR[mission.state],
            emissiveIntensity: mission.state === 'locked' ? 0 : 0.35,
          }),
        );
        node.position.set(Math.cos(angle) * 1.25, 0.32, -Math.sin(angle) * 1.05 + 0.45);
        node.userData['missionId'] = mission.id;
        node.userData['clickable'] = mission.state !== 'locked';
        node.userData['phase'] = j * 0.9;
        group.add(node);
        this.nodes.push(node);

        if (mission.current) {
          this.ring.visible = true;
          node.getWorldPosition(this.ring.position);
          group.updateMatrixWorld(true);
          const world = new THREE.Vector3();
          node.getWorldPosition(world);
          this.ring.position.set(world.x, 0.05 + group.position.y, world.z);
        }
      });

      this.scene.add(group);
      this.islands.push(group);
    });

    if (!this.options.animate) this.renderer.render(this.scene, this.camera);
  }

  /* ---------- Interaction ---------- */

  private updatePointer(e: PointerEvent): void {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  private nodeUnder(e: PointerEvent): THREE.Mesh | null {
    this.updatePointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster
      .intersectObjects(this.nodes, false)
      .find(g => g.object.userData['clickable']);
    return (hit?.object as THREE.Mesh) ?? null;
  }

  private handleClick(e: PointerEvent): void {
    const node = this.nodeUnder(e);
    if (node) this.options.onMissionClick?.(node.userData['missionId'] as string);
  }

  /* ---------- Loop ---------- */

  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop);
    const t = this.clock.getElapsedTime();

    // Islands and nodes breathe; the particles float
    this.islands.forEach(island => {
      island.position.y = Math.sin(t * 0.7 + (island.userData['phase'] as number)) * 0.12;
    });
    this.nodes.forEach(node => {
      const phase = node.userData['phase'] as number;
      node.position.y = 0.32 + Math.sin(t * 1.6 + phase) * 0.05;
      node.rotation.y = t * 0.4 + phase;
    });
    this.particles.rotation.y = t * 0.02;

    // Ring of the current mission: continuous pulse
    if (this.ring.visible) {
      const pulse = (t % 1.6) / 1.6;
      this.ring.scale.setScalar(1 + pulse * 0.9);
      (this.ring.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - pulse);
    }

    // Soft camera parallax toward the pointer
    this.camera.position.x += (this.pointer.x * 1.1 - this.camera.position.x) * 0.03;
    this.camera.position.y += (5.4 + this.pointer.y * 0.5 - this.camera.position.y) * 0.03;
    this.camera.lookAt(0, 0.2, 0);

    // Hand cursor over clickable nodes
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster
      .intersectObjects(this.nodes, false)
      .find(g => g.object.userData['clickable']);
    const node = (hit?.object as THREE.Mesh) ?? null;
    if (node !== this.nodeUnderPointer) {
      this.nodeUnderPointer?.scale.setScalar(1);
      this.nodeUnderPointer = node;
      this.canvas.style.cursor = node ? 'pointer' : 'default';
    }
    this.nodeUnderPointer?.scale.setScalar(1.3);

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
    if (!this.options.animate) this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.removeListeners();
    this.scene.traverse(obj => this.disposeMeshes(obj));
    this.renderer.dispose();
  }

  private disposeObject(root: THREE.Object3D): void {
    root.traverse(obj => this.disposeMeshes(obj));
  }

  private disposeMeshes(obj: THREE.Object3D): void {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) material.forEach(m => m.dispose());
    else material?.dispose();
  }
}
