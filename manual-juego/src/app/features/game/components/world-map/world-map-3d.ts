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
import { IslandState, WorldEngine } from '../../../../platform/three/world-engine';

/**
 * Three.js canvas of the map. It is decorative and interactive (click on the
 * nodes), but NOT the only path: the accessible mission list lives below, in
 * the map itself. Without WebGL or with prefers-reduced-motion it degrades on
 * its own.
 */
@Component({
  selector: 'app-world-map-3d',
  template: `
    @if (hasWebgl()) {
      <canvas #canvas aria-hidden="true"></canvas>
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
    :host.hidden { display: none; }
    canvas { width: 100%; height: 100%; display: block; touch-action: pan-y; }
  `,
  host: { '[class.hidden]': '!hasWebgl()' },
})
export class Map3d implements OnDestroy {
  private readonly zone = inject(NgZone);

  readonly islands = input.required<IslandState[]>();
  readonly missionChosen = output<string>();

  protected readonly hasWebgl = signal(true);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  private engine: WorldEngine | null = null;
  private observer: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => this.mount());

    // Every progress change redraws islands and nodes.
    effect(() => {
      const data = this.islands();
      this.engine?.update(data);
    });
  }

  private mount(): void {
    const canvas = this.canvas()?.nativeElement;
    if (!canvas) return;

    // WebGL detection: without support, the 2D map below is enough.
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    if (!gl) {
      this.hasWebgl.set(false);
      return;
    }

    const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // The rAF loop lives outside Angular: it does not trigger change detection.
    this.zone.runOutsideAngular(() => {
      this.engine = new WorldEngine(canvas, {
        animate,
        onMissionClick: id => this.zone.run(() => this.missionChosen.emit(id)),
      });
      this.engine.update(this.islands());
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
