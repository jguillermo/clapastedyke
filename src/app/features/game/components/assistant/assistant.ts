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
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { ChefEngine } from '../../../../platform/three/chef-engine';

/**
 * The game assistant: a 3D pastry chef + speech bubble.
 * Floats in the corner, says what to do in each step, and celebrates the wins.
 * Without WebGL it shows the 👩‍🍳 emoji; with prefers-reduced-motion it stays still.
 */
@Component({
  selector: 'app-assistant',
  imports: [TranslocoPipe],
  providers: [provideTranslocoScope('game')],
  template: `
    <div class="bubble">
      <p class="text" [innerHTML]="message()"></p>
      @if (expected(); as exp) {
        <p class="expected">{{ 'game.assistant.type' | transloco }} <b class="tag">{{ exp }}</b></p>
      }
      @if (ready()) {
        <p class="done" [innerHTML]="'game.assistant.ready' | transloco"></p>
      }
    </div>
    @if (hasWebgl()) {
      <canvas #canvas width="150" height="180" aria-hidden="true"></canvas>
    } @else {
      <span class="emoji" aria-hidden="true">👩‍🍳</span>
    }
  `,
  styleUrl: './assistant.scss',
})
export class Assistant implements OnDestroy {
  private readonly zone = inject(NgZone);

  /** Step instruction (content HTML). */
  readonly message = input.required<string>();
  /** Sample value still to be typed (null if none or already done). */
  readonly expected = input<string | null>(null);
  /** All correct: the chef celebrates and the bubble nudges to continue. */
  readonly ready = input<boolean>(false);

  protected readonly hasWebgl = signal(true);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private engine: ChefEngine | null = null;

  constructor() {
    afterNextRender(() => this.mount());

    // Celebrates every time the challenge becomes ready.
    effect(() => {
      if (this.ready()) this.engine?.celebrate();
    });
  }

  private mount(): void {
    const canvas = this.canvas()?.nativeElement;
    if (!canvas) return;
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') ?? probe.getContext('webgl'))) {
      this.hasWebgl.set(false);
      return;
    }
    const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.zone.runOutsideAngular(() => {
      this.engine = new ChefEngine(canvas, animate);
    });
  }

  ngOnDestroy(): void {
    this.engine?.dispose();
    this.engine = null;
  }
}
