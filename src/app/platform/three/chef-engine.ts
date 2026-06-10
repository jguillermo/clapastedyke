import { Group, Vector3 } from 'three';
import { buildChefMesh } from './chef-mesh';

/**
 * Anima al chef placeholder: respiración/idle constante y un gesto de
 * celebración (`celebrate()`) para el cierre de nivel. Sin estado de negocio.
 *
 * Respeta movimiento reducido: si `reducedMotion`, no respira ni salta.
 */
export class ChefEngine {
  readonly group: Group;
  private readonly baseY: number;
  private elapsed = 0;
  private celebrateUntil = 0;

  constructor(
    position: Vector3,
    private readonly reducedMotion: boolean,
  ) {
    this.group = buildChefMesh();
    this.group.position.copy(position);
    this.baseY = position.y;
  }

  /** Dispara un breve gesto de celebración (saltito + giro). */
  celebrate(): void {
    if (this.reducedMotion) {
      return;
    }
    this.celebrateUntil = this.elapsed + 1.6;
  }

  /** Avanza la animación. `dt` en segundos. */
  update(dt: number): void {
    this.elapsed += dt;
    if (this.reducedMotion) {
      return;
    }

    // Respiración idle (oscilación suave de escala vertical).
    const breathe = 1 + Math.sin(this.elapsed * 1.6) * 0.02;
    this.group.scale.set(1, breathe, 1);

    // Celebración: saltito amortiguado + giro.
    if (this.elapsed < this.celebrateUntil) {
      const t = 1 - (this.celebrateUntil - this.elapsed) / 1.6;
      const hop = Math.sin(t * Math.PI * 2) * 0.25 * (1 - t);
      this.group.position.y = this.baseY + Math.max(0, hop);
      this.group.rotation.y += dt * 6;
    } else {
      this.group.position.y = this.baseY;
    }
  }
}
