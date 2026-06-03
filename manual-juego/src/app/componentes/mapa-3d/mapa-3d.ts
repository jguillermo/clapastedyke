import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { IslaEstado, MotorMundo } from '../../three/motor-mundo';

/**
 * Lienzo Three.js del mapa. Es decorativo e interactivo (clic en los nodos),
 * pero NO es la única vía: la lista accesible de misiones vive debajo, en el
 * propio mapa. Sin WebGL o con prefers-reduced-motion se degrada solo.
 */
@Component({
  selector: 'app-mapa-3d',
  template: `
    @if (conWebgl()) {
      <canvas #lienzo aria-hidden="true"></canvas>
    }
  `,
  styles: `
    :host {
      display: block;
      height: clamp(240px, 36vh, 330px);
      border-radius: 22px;
      overflow: hidden;
      border: 1px solid var(--line);
      background: linear-gradient(180deg, #f9f3e9, #f3e9d8);
      box-shadow: var(--shadow-sm);
    }
    :host.oculto { display: none; }
    canvas { width: 100%; height: 100%; display: block; touch-action: pan-y; }
  `,
  host: { '[class.oculto]': '!conWebgl()' },
})
export class Mapa3d implements OnDestroy {
  private readonly zone = inject(NgZone);

  readonly islas = input.required<IslaEstado[]>();
  readonly misionElegida = output<string>();

  protected readonly conWebgl = signal(true);
  private readonly lienzo = viewChild<ElementRef<HTMLCanvasElement>>('lienzo');

  private motor: MotorMundo | null = null;
  private observador: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => this.montar());

    // Cada cambio de progreso redibuja islas y nodos.
    effect(() => {
      const datos = this.islas();
      this.motor?.actualizar(datos);
    });
  }

  private montar(): void {
    const canvas = this.lienzo()?.nativeElement;
    if (!canvas) return;

    // Detección de WebGL: sin soporte, el mapa 2D de abajo basta.
    const prueba = document.createElement('canvas');
    const gl = prueba.getContext('webgl2') ?? prueba.getContext('webgl');
    if (!gl) {
      this.conWebgl.set(false);
      return;
    }

    const animar = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // El bucle rAF vive fuera de Angular: no dispara change detection.
    this.zone.runOutsideAngular(() => {
      this.motor = new MotorMundo(canvas, {
        animar,
        alClicMision: id => this.zone.run(() => this.misionElegida.emit(id)),
      });
      this.motor.actualizar(this.islas());
      this.observador = new ResizeObserver(() => this.motor?.resize());
      this.observador.observe(canvas.parentElement ?? canvas);
    });
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
    this.motor?.dispose();
    this.motor = null;
  }
}
