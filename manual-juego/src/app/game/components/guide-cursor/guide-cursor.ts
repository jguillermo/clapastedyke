import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';

/**
 * Guide cursor: a little hand that travels from the chef to the target element
 * of the real form and makes the click gesture (halo), in a gentle loop.
 * It recomputes the target position EVERY cycle (survives scroll/resize).
 * With prefers-reduced-motion it does not travel: it just leaves the halo fixed
 * on the target.
 */
@Component({
  selector: 'app-guide-cursor',
  template: `
    <span #hand class="hand" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M5 3l14 9-6.5 1L9 19z" /></svg>
      <span class="halo"></span>
    </span>
  `,
  styleUrl: './guide-cursor.scss',
})
export class GuideCursor implements OnDestroy {
  private readonly zone = inject(NgZone);

  /** Id of the real DOM element to point at (first highlightId of the step). */
  readonly targetId = input<string | null>(null);

  private readonly hand = viewChild.required<ElementRef<HTMLSpanElement>>('hand');
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    // Restarts the cycle every time the target changes.
    effect(() => {
      const id = this.targetId();
      this.stop();
      if (id) this.zone.runOutsideAngular(() => this.scheduleCycle(id, 600));
    });
  }

  private scheduleCycle(id: string, wait: number): void {
    this.timer = setTimeout(() => this.cycle(id), wait);
  }

  private cycle(id: string): void {
    const target = document.getElementById(id);
    const el = this.hand().nativeElement;
    if (!target) {
      // The element may appear late (lists painted by JS): retry.
      this.scheduleCycle(id, 800);
      return;
    }

    const r = target.getBoundingClientRect();
    const destX = Math.min(r.left + Math.min(r.width * 0.7, 220), window.innerWidth - 30);
    const destY = r.top + r.height * 0.7;

    if (this.reduceMotion) {
      // No travel: halo fixed over the target.
      el.style.transition = 'none';
      el.style.transform = `translate(${destX}px, ${destY}px)`;
      el.classList.add('click');
      return;
    }

    // Starts from the chef's area (bottom right)
    el.classList.remove('click');
    el.style.transition = 'none';
    el.style.transform = `translate(${window.innerWidth - 120}px, ${window.innerHeight - 160}px)`;
    el.style.opacity = '0';

    // Travels to the target
    requestAnimationFrame(() => {
      el.style.transition = 'transform 1.3s cubic-bezier(.45,0,.25,1), opacity .4s ease';
      el.style.opacity = '1';
      el.style.transform = `translate(${destX}px, ${destY}px)`;
    });

    // Click on arrival, pause, and repeat
    this.timer = setTimeout(() => {
      el.classList.add('click');
      this.timer = setTimeout(() => {
        el.style.opacity = '0';
        el.classList.remove('click');
        this.scheduleCycle(id, 900);
      }, 1700);
    }, 1450);
  }

  private stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
