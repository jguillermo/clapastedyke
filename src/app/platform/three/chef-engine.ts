import * as THREE from 'three';
import { buildChef } from './chef-mesh';

/**
 * The pastry chef: a low-poly character that accompanies each challenge.
 * Floats, waves while pointing with her arm, and celebrates when you get it right.
 * Pure class without Angular; the component creates it outside NgZone.
 */
export class ChefEngine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new THREE.Clock();

  private body!: THREE.Group;
  private arm!: THREE.Group;
  private head!: THREE.Group;

  private animationId = 0;
  /** Moment (clock seconds) when the celebration started; -1 = not celebrating. */
  private celebrating = -1;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly animate: boolean,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth || 150, canvas.clientHeight || 180, false);

    this.camera = new THREE.PerspectiveCamera(
      35,
      (canvas.clientWidth || 150) / (canvas.clientHeight || 180),
      0.1,
      20,
    );
    this.camera.position.set(0, 1.15, 4.1);
    this.camera.lookAt(0, 0.95, 0);

    this.scene.add(new THREE.HemisphereLight(0xfff6ea, 0xd8c9b4, 1.35));
    const sun = new THREE.DirectionalLight(0xffe7cd, 1.4);
    sun.position.set(2, 4, 3);
    this.scene.add(sun);

    this.body = buildChef();
    this.arm = this.body.getObjectByName('arm') as THREE.Group;
    this.head = this.body.getObjectByName('head') as THREE.Group;
    this.body.position.y = -0.15;
    this.body.rotation.y = -0.35;
    this.scene.add(this.body);

    if (this.animate) this.loop();
    else this.renderer.render(this.scene, this.camera);
  }

  /** Jumps and spins once: the field is now correct. */
  celebrate(): void {
    this.celebrating = this.clock.getElapsedTime();
    if (!this.animate) this.renderer.render(this.scene, this.camera);
  }

  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop);
    const t = this.clock.getElapsedTime();

    // Breathing and floating
    this.body.position.y = -0.15 + Math.sin(t * 1.8) * 0.05;
    this.head.rotation.z = Math.sin(t * 1.1) * 0.06;

    // The arm points with a gentle sway
    this.arm.rotation.z = -2.1 + Math.sin(t * 2.4) * 0.18;

    // Celebration: jump + spin (1.1 s)
    if (this.celebrating >= 0) {
      const c = (t - this.celebrating) / 1.1;
      if (c >= 1) {
        this.celebrating = -1;
        this.body.rotation.y = -0.35;
      } else {
        this.body.position.y += Math.sin(c * Math.PI) * 0.45;
        this.body.rotation.y = -0.35 + c * Math.PI * 2;
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.scene.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(m)) m.forEach(x => x.dispose());
      else m?.dispose();
    });
    this.renderer.dispose();
  }
}
