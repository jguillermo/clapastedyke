import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MotorChef } from '../../three/motor-chef';

/**
 * La ayudante del juego: chef repostera 3D + burbuja de diálogo.
 * Flota en la esquina, dice qué hacer en cada paso y celebra los aciertos.
 * Sin WebGL muestra el emoji 👩‍🍳; con prefers-reduced-motion queda quieta.
 */
@Component({
  selector: 'app-ayudante',
  template: `
    <div class="burbuja">
      <p class="texto" [innerHTML]="mensaje()"></p>
      @if (esperado(); as esp) {
        <p class="esperado">Escribe: <b class="tag">{{ esp }}</b></p>
      }
      @if (listo()) {
        <p class="listo">✓ ¡Perfecto! Toca <b>«Ya lo completé»</b></p>
      }
    </div>
    @if (conWebgl()) {
      <canvas #lienzo width="150" height="180" aria-hidden="true"></canvas>
    } @else {
      <span class="emoji" aria-hidden="true">👩‍🍳</span>
    }
  `,
  styleUrl: './ayudante.scss',
})
export class Ayudante implements OnDestroy {
  private readonly zone = inject(NgZone);

  /** Instrucción del paso (HTML del contenido). */
  readonly mensaje = input.required<string>();
  /** Valor de ejemplo que falta por escribir (null si no hay o ya está). */
  readonly esperado = input<string | null>(null);
  /** Todo correcto: la chef celebra y la burbuja anima a continuar. */
  readonly listo = input<boolean>(false);

  protected readonly conWebgl = signal(true);
  private readonly lienzo = viewChild<ElementRef<HTMLCanvasElement>>('lienzo');
  private motor: MotorChef | null = null;

  constructor() {
    afterNextRender(() => this.montar());

    // Celebra cada vez que el reto pasa a estar listo.
    effect(() => {
      if (this.listo()) this.motor?.celebrar();
    });
  }

  private montar(): void {
    const canvas = this.lienzo()?.nativeElement;
    if (!canvas) return;
    const prueba = document.createElement('canvas');
    if (!(prueba.getContext('webgl2') ?? prueba.getContext('webgl'))) {
      this.conWebgl.set(false);
      return;
    }
    const animar = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.zone.runOutsideAngular(() => {
      this.motor = new MotorChef(canvas, animar);
    });
  }

  ngOnDestroy(): void {
    this.motor?.dispose();
    this.motor = null;
  }
}
