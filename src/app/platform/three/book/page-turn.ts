/**
 * Tween del volteo de página: interpola `progress` (0↔1) con la misma curva
 * `easeOutCubic` que usa `camera-rig.ts`, y notifica cada cuadro vía callback.
 * El motor del libro traduce ese `progress` a los uniforms de la hoja.
 *
 * Resuelve una `Promise` al terminar (o de inmediato con `reducedMotion`).
 */

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface Tween {
  from: number;
  to: number;
  duration: number;
  elapsed: number;
  resolve: () => void;
}

export class PageTurn {
  private tween: Tween | null = null;

  constructor(
    private readonly onProgress: (progress: number) => void,
    private readonly reducedMotion: boolean,
  ) {}

  /** Hay un volteo en curso. */
  get animating(): boolean {
    return this.tween !== null;
  }

  /**
   * Acelera el volteo en curso para encadenar el siguiente (al pulsar de nuevo
   * antes de terminar): acorta el remanente a un instante. Como un libro real al
   * pasar varias hojas seguidas.
   */
  hurry(): void {
    if (this.tween) {
      const remaining = this.tween.duration - this.tween.elapsed;
      if (remaining > 0.16) {
        this.tween.duration = this.tween.elapsed + 0.16;
      }
    }
  }

  /** Anima `progress` de `from` a `to`. Resuelve al terminar. */
  start(from: number, to: number, duration = 0.9): Promise<void> {
    this.tween?.resolve();
    this.tween = null;
    this.onProgress(from);
    if (this.reducedMotion) {
      this.onProgress(to);
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.tween = { from, to, duration, elapsed: 0, resolve };
    });
  }

  /** Avanza el tween activo. `dt` en segundos. */
  update(dt: number): void {
    const tw = this.tween;
    if (!tw) {
      return;
    }
    tw.elapsed += dt;
    const k = easeOutCubic(Math.min(tw.elapsed / tw.duration, 1));
    this.onProgress(tw.from + (tw.to - tw.from) * k);
    if (tw.elapsed >= tw.duration) {
      this.onProgress(tw.to);
      this.tween = null;
      tw.resolve();
    }
  }
}
