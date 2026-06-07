import { PerspectiveCamera, Vector3 } from 'three';

/**
 * Control de cámara cinematográfico. Implementa el comportamiento del mundo
 * descrito en .claude/doc/capitulo_00_libro_de_recetas.md §7:
 *   - `flyIn()`       — entrada suave hasta la vista de cocina.
 *   - `focusStation()`— acerca la cámara a una estación.
 *   - `resetView()`   — vuelve a la vista general.
 *
 * Accesibilidad: con `prefers-reduced-motion` no hay recorridos — los cambios de
 * vista son directos (sin tween) y `flyIn()` resuelve de inmediato.
 */

const HOME_POS = new Vector3(6.5, 6, 6.5);
const HOME_LOOK = new Vector3(0, 1, 0);
const FLY_IN_START = new Vector3(12, 11, 12);

interface Tween {
  fromPos: Vector3;
  toPos: Vector3;
  fromLook: Vector3;
  toLook: Vector3;
  duration: number;
  elapsed: number;
  resolve: () => void;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class CameraRig {
  readonly camera: PerspectiveCamera;
  private readonly look = HOME_LOOK.clone();
  private tween: Tween | null = null;

  constructor(
    aspect: number,
    private readonly reducedMotion: boolean,
  ) {
    this.camera = new PerspectiveCamera(30, aspect, 0.1, 100);
    this.camera.position.copy(HOME_POS);
    this.camera.lookAt(this.look);
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /** Entrada cinematográfica ciudad → casa → cocina. Resuelve al terminar. */
  flyIn(): Promise<void> {
    if (this.reducedMotion) {
      this.snap(HOME_POS, HOME_LOOK);
      return Promise.resolve();
    }
    this.camera.position.copy(FLY_IN_START);
    return this.animateTo(HOME_POS, HOME_LOOK, 1.8);
  }

  /** Acerca la cámara a una estación, mirándola. */
  focusStation(target: Vector3): Promise<void> {
    const offset = new Vector3().subVectors(HOME_POS, target).normalize().multiplyScalar(3);
    const pos = new Vector3().addVectors(target, offset).add(new Vector3(0, 0.8, 0));
    if (this.reducedMotion) {
      this.snap(pos, target);
      return Promise.resolve();
    }
    return this.animateTo(pos, target, 0.7);
  }

  /** Vuelve a la vista general de la cocina. */
  resetView(): Promise<void> {
    if (this.reducedMotion) {
      this.snap(HOME_POS, HOME_LOOK);
      return Promise.resolve();
    }
    return this.animateTo(HOME_POS, HOME_LOOK, 0.6);
  }

  /** Avanza el tween activo. `dt` en segundos. */
  update(dt: number): void {
    if (!this.tween) {
      return;
    }
    const tw = this.tween;
    tw.elapsed += dt;
    const k = easeOutCubic(Math.min(tw.elapsed / tw.duration, 1));
    this.camera.position.lerpVectors(tw.fromPos, tw.toPos, k);
    this.look.lerpVectors(tw.fromLook, tw.toLook, k);
    this.camera.lookAt(this.look);
    if (tw.elapsed >= tw.duration) {
      this.tween = null;
      tw.resolve();
    }
  }

  private snap(pos: Vector3, look: Vector3): void {
    this.tween = null;
    this.camera.position.copy(pos);
    this.look.copy(look);
    this.camera.lookAt(this.look);
  }

  private animateTo(toPos: Vector3, toLook: Vector3, duration: number): Promise<void> {
    // Si había un tween en curso, su promesa queda resuelta al ser reemplazado.
    this.tween?.resolve();
    return new Promise<void>((resolve) => {
      this.tween = {
        fromPos: this.camera.position.clone(),
        toPos: toPos.clone(),
        fromLook: this.look.clone(),
        toLook: toLook.clone(),
        duration,
        elapsed: 0,
        resolve,
      };
    });
  }
}
