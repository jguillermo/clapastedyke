import * as THREE from 'three';
import { CAMERA_HOME, LOOK_HOME, easeInOut } from './town-layout';

interface Tween {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromLook: THREE.Vector3;
  toLook: THREE.Vector3;
  dur: number;
  start: number; // -1 until the first update frame stamps it
}

/**
 * Drives the camera: a soft orbit + pointer parallax at home, a cinematic eased
 * dolly when focusing/leaving a building, and a tiny idle sway while focused.
 * Holds no scene knowledge — the engine feeds it the focus target.
 */
export class CameraRig {
  private readonly look = LOOK_HOME.clone();
  private readonly desiredPos = new THREE.Vector3(CAMERA_HOME.x, CAMERA_HOME.y, CAMERA_HOME.z);
  private readonly desiredLook = LOOK_HOME.clone();
  private tween: Tween | null = null;
  private focusedId: string | null = null;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly animate: boolean,
  ) {}

  get focused(): boolean {
    return this.focusedId !== null;
  }

  get tweening(): boolean {
    return this.tween !== null;
  }

  /** Dolly toward a building's door. */
  focus(id: string, x: number, z: number): void {
    this.focusedId = id;
    this.desiredPos.set(x * 0.6, 3.2, z + 6.5);
    this.desiredLook.set(x, 1, z);
    this.begin(0.9);
  }

  /** Pull back to the town overview. */
  reset(): void {
    this.focusedId = null;
    this.desiredPos.set(CAMERA_HOME.x, CAMERA_HOME.y, CAMERA_HOME.z);
    this.desiredLook.copy(LOOK_HOME);
    this.begin(0.8);
  }

  update(t: number, pointer: THREE.Vector2): void {
    if (this.tween) {
      if (this.tween.start < 0) this.tween.start = t;
      const p = Math.min(1, (t - this.tween.start) / this.tween.dur);
      const e = easeInOut(p);
      this.camera.position.lerpVectors(this.tween.fromPos, this.tween.toPos, e);
      this.look.lerpVectors(this.tween.fromLook, this.tween.toLook, e);
      if (p >= 1) this.tween = null;
    } else if (!this.focusedId) {
      // Parallax only when the pointer is over the canvas (sentinel is off-screen).
      const px = Math.abs(pointer.x) <= 1 ? pointer.x : 0;
      const py = Math.abs(pointer.y) <= 1 ? pointer.y : 0;
      const orbit = Math.sin(t * 0.05) * 0.8;
      this.desiredPos.set(CAMERA_HOME.x + orbit + px * 0.7, CAMERA_HOME.y + py * 0.35, CAMERA_HOME.z);
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

  private begin(dur: number): void {
    if (!this.animate) {
      this.camera.position.copy(this.desiredPos);
      this.look.copy(this.desiredLook);
      this.camera.lookAt(this.look);
      return;
    }
    this.tween = {
      fromPos: this.camera.position.clone(),
      toPos: this.desiredPos.clone(),
      fromLook: this.look.clone(),
      toLook: this.desiredLook.clone(),
      dur,
      start: -1,
    };
  }
}
