import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  afterNextRender,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { KitchenEngine } from '../../../../platform/three/kitchen-engine';

/**
 * Canvas 3D de la cocina (WorldScene.KITCHEN). Decorativo e interactivo (tocar
 * una estación), pero NO es la única vía: el dock accesible vive en el shell.
 * Sin WebGL o con prefers-reduced-motion degrada solo.
 */
@Component({
  selector: 'app-home-3d',
  template: `
    @if (hasWebgl()) {
      <canvas #canvas aria-hidden="true"></canvas>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
      overflow: hidden;
      background: radial-gradient(120% 100% at 50% 0%, #fbf6ee, #efe0c9);
    }
    :host.hidden { display: none; }
    canvas { width: 100%; height: 100%; display: block; touch-action: none; }
  `,
  host: { '[class.hidden]': '!hasWebgl()' },
})
export class Home3d implements OnDestroy {
  private readonly zone = inject(NgZone);

  readonly stationChosen = output<string>();

  protected readonly hasWebgl = signal(true);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  private engine: KitchenEngine | null = null;
  private observer: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => this.mount());
  }

  private mount(): void {
    const canvas = this.canvas()?.nativeElement;
    if (!canvas) return;

    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    if (!gl) {
      this.hasWebgl.set(false);
      return;
    }

    const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.zone.runOutsideAngular(() => {
      this.engine = new KitchenEngine(canvas, {
        animate,
        onStationClick: id => this.zone.run(() => this.stationChosen.emit(id)),
      });
      this.observer = new ResizeObserver(() => this.engine?.resize());
      this.observer.observe(canvas.parentElement ?? canvas);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.engine?.dispose();
    this.engine = null;
  }
}
