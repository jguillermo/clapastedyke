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
import { BuildingState, TownEngine } from '../../../../platform/three/town-engine';

/**
 * Three.js canvas of the town. Decorative and interactive (click a building),
 * but NOT the only path: the accessible building list lives in the shell.
 * Without WebGL or with prefers-reduced-motion it degrades on its own.
 *
 * WebGL probe, reduced-motion, ResizeObserver, engine created outside NgZone,
 * redraw on input change, dispose on destroy.
 */
@Component({
  selector: 'app-town-3d',
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
      background: linear-gradient(180deg, #fbf6ee, #efe0c9);
    }
    :host.hidden { display: none; }
    canvas { width: 100%; height: 100%; display: block; touch-action: none; }
  `,
  host: { '[class.hidden]': '!hasWebgl()' },
})
export class Town3d implements OnDestroy {
  private readonly zone = inject(NgZone);

  readonly buildings = input.required<BuildingState[]>();
  /** Token toggled by the shell to ask the camera to focus/reset. */
  readonly focus = input<string | null>(null);
  readonly buildingChosen = output<string>();

  protected readonly hasWebgl = signal(true);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  private engine: TownEngine | null = null;
  private observer: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => this.mount());

    // Every state change redraws the town.
    effect(() => {
      const data = this.buildings();
      this.engine?.update(data);
    });

    // The shell drives the cinematic zoom: focus(id) → dolly in, focus(null) → pull back.
    effect(() => {
      const id = this.focus();
      if (id) this.engine?.focusBuilding(id);
      else this.engine?.resetView();
    });
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
      this.engine = new TownEngine(canvas, {
        animate,
        onBuildingClick: id => this.zone.run(() => this.buildingChosen.emit(id)),
      });
      this.engine.update(this.buildings());
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
