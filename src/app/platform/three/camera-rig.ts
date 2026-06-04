import * as THREE from 'three';
import { CAMERA_HOME, LOOK_HOME, easeInOut } from './town-layout';

interface Tween {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromLook: THREE.Vector3;
  toLook: THREE.Vector3;
  dur: number;
  start: number; // -1 hasta que el primer frame lo estampa
}

/** Un paso de una cinemática: posición + punto de mira + duración (s). */
export interface CameraPose {
  x: number;
  y: number;
  z: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  dur: number;
}

/**
 * Conduce la cámara: órbita suave + parallax al puntero en reposo, dolly
 * cinematográfico al enfocar/salir, balanceo leve mientras está enfocada, y
 * cinemáticas encadenadas (flyIn/flyOut) vía `flyThrough`. El "home" es
 * configurable para reutilizar el rig en la cocina y en el pueblo.
 */
export class CameraRig {
  private readonly homePos: THREE.Vector3;
  private readonly homeLook: THREE.Vector3;
  private readonly look: THREE.Vector3;
  private readonly desiredPos: THREE.Vector3;
  private readonly desiredLook: THREE.Vector3;
  private tween: Tween | null = null;
  private queue: Tween[] = [];
  private flying = false;
  private onDone: (() => void) | undefined;
  private focusedId: string | null = null;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly animate: boolean,
    home?: { pos: THREE.Vector3; look: THREE.Vector3 },
  ) {
    this.homePos = home?.pos.clone() ?? new THREE.Vector3(CAMERA_HOME.x, CAMERA_HOME.y, CAMERA_HOME.z);
    this.homeLook = home?.look.clone() ?? LOOK_HOME.clone();
    this.look = this.homeLook.clone();
    this.desiredPos = this.homePos.clone();
    this.desiredLook = this.homeLook.clone();
    this.camera.position.copy(this.homePos);
    this.camera.lookAt(this.look);
  }

  get focused(): boolean {
    return this.focusedId !== null;
  }

  get tweening(): boolean {
    return this.tween !== null || this.queue.length > 0;
  }

  /** Reubica el "home" (p. ej. tras medir la sala); si está en reposo, lo adopta. */
  setHome(pos: THREE.Vector3, look: THREE.Vector3): void {
    this.homePos.copy(pos);
    this.homeLook.copy(look);
    if (!this.flying && !this.tween && !this.focusedId && !this.queue.length) {
      this.desiredPos.copy(pos);
      this.desiredLook.copy(look);
    }
  }

  /** Dolly hacia la puerta de un edificio (o estación de la cocina). */
  focus(id: string, x: number, z: number): void {
    this.focusedId = id;
    this.desiredPos.set(x * 0.6, 3.2, z + 6.5);
    this.desiredLook.set(x, 1, z);
    this.begin(0.9);
  }

  /** Vuelve a la vista general. */
  reset(): void {
    this.focusedId = null;
    this.desiredPos.copy(this.homePos);
    this.desiredLook.copy(this.homeLook);
    this.begin(0.8);
  }

  /** Cinemática encadenada (flyIn/flyOut): recorre los pasos en orden. */
  flyThrough(steps: CameraPose[], onDone?: () => void): void {
    if (!steps.length) {
      onDone?.();
      return;
    }
    if (!this.animate) {
      const last = steps[steps.length - 1];
      this.camera.position.set(last.x, last.y, last.z);
      this.look.set(last.lookX, last.lookY, last.lookZ);
      this.camera.lookAt(this.look);
      onDone?.();
      return;
    }
    this.flying = true;
    this.focusedId = null;
    this.onDone = onDone;
    this.tween = null;
    let fromPos = this.camera.position.clone();
    let fromLook = this.look.clone();
    this.queue = steps.map(s => {
      const toPos = new THREE.Vector3(s.x, s.y, s.z);
      const toLook = new THREE.Vector3(s.lookX, s.lookY, s.lookZ);
      const tw: Tween = {
        fromPos: fromPos.clone(),
        toPos: toPos.clone(),
        fromLook: fromLook.clone(),
        toLook: toLook.clone(),
        dur: s.dur,
        start: -1,
      };
      fromPos = toPos;
      fromLook = toLook;
      return tw;
    });
  }

  update(t: number, pointer: THREE.Vector2): void {
    if (!this.tween && this.queue.length) this.tween = this.queue.shift() ?? null;

    if (this.tween) {
      if (this.tween.start < 0) this.tween.start = t;
      const p = Math.min(1, (t - this.tween.start) / this.tween.dur);
      const e = easeInOut(p);
      this.camera.position.lerpVectors(this.tween.fromPos, this.tween.toPos, e);
      this.look.lerpVectors(this.tween.fromLook, this.tween.toLook, e);
      if (p >= 1) {
        this.tween = null;
        if (!this.queue.length && this.flying) {
          this.flying = false;
          const done = this.onDone;
          this.onDone = undefined;
          done?.();
        }
      }
    } else if (!this.focusedId) {
      const px = Math.abs(pointer.x) <= 1 ? pointer.x : 0;
      const py = Math.abs(pointer.y) <= 1 ? pointer.y : 0;
      const orbit = Math.sin(t * 0.05) * 0.8;
      this.desiredPos.set(this.homePos.x + orbit + px * 0.7, this.homePos.y + py * 0.35, this.homePos.z);
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
    this.flying = false;
    this.queue = [];
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
