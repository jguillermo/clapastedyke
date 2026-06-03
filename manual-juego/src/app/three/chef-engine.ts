import * as THREE from 'three';

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

  private readonly body = new THREE.Group();
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

    this.buildChef();
    this.scene.add(this.body);

    if (this.animate) this.loop();
    else this.renderer.render(this.scene, this.camera);
  }

  private material(color: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85 });
  }

  private buildChef(): void {
    // Torso with apron
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.5, 0.95, 8),
      this.material(0xfff8f0),
    );
    torso.position.y = 0.45;
    this.body.add(torso);
    const apron = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.49, 0.6, 8),
      this.material(0xbb5530),
    );
    apron.position.y = 0.3;
    this.body.add(apron);

    // Head + chef hat
    this.head = new THREE.Group();
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), this.material(0xf2c9a0));
    this.head.add(face);
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), this.material(0x2a2420));
    leftEye.position.set(-0.14, 0.05, 0.36);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.14;
    this.head.add(leftEye, rightEye);
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.025, 6, 10, Math.PI),
      this.material(0x9a4324),
    );
    smile.position.set(0, -0.1, 0.36);
    smile.rotation.x = Math.PI;
    this.head.add(smile);
    const hatBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.36, 0.22, 8),
      this.material(0xffffff),
    );
    hatBase.position.y = 0.38;
    const hatTop = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), this.material(0xffffff));
    hatTop.position.y = 0.58;
    hatTop.scale.set(1, 0.75, 1);
    this.head.add(hatBase, hatTop);
    this.head.position.y = 1.25;
    this.body.add(this.head);

    // Left arm pinned to the body
    const leftArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.08, 0.55, 6),
      this.material(0xfff8f0),
    );
    leftArm.position.set(-0.45, 0.72, 0);
    leftArm.rotation.z = 0.5;
    this.body.add(leftArm);

    // Right arm that POINTS (with a wooden spoon)
    this.arm = new THREE.Group();
    const rightArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.08, 0.6, 6),
      this.material(0xfff8f0),
    );
    rightArm.position.y = 0.3;
    this.arm.add(rightArm);
    const spoon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6),
      this.material(0xcf9a32),
    );
    spoon.position.y = 0.72;
    const spoonTip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), this.material(0xcf9a32));
    spoonTip.position.y = 0.94;
    spoonTip.scale.set(1, 1.25, 0.6);
    this.arm.add(spoon, spoonTip);
    this.arm.position.set(0.42, 0.55, 0.1);
    this.arm.rotation.z = -2.1; // pointing to the left (toward the form)
    this.body.add(this.arm);

    this.body.position.y = -0.15;
    this.body.rotation.y = -0.35;
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
