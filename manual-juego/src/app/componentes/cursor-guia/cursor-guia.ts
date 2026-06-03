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
 * Cursor-guía: una manita que viaja desde la chef hasta el elemento objetivo
 * del formulario real y hace el gesto de clic (halo), en bucle suave.
 * Calcula la posición del objetivo EN CADA ciclo (sobrevive a scroll/resize).
 * Con prefers-reduced-motion no viaja: solo deja el halo fijo en el objetivo.
 */
@Component({
  selector: 'app-cursor-guia',
  template: `
    <span #mano class="mano" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M5 3l14 9-6.5 1L9 19z"/></svg>
      <span class="halo"></span>
    </span>
  `,
  styleUrl: './cursor-guia.scss',
})
export class CursorGuia implements OnDestroy {
  private readonly zone = inject(NgZone);

  /** Id del elemento del DOM real a señalar (primer resaltarId del paso). */
  readonly objetivoId = input<string | null>(null);

  private readonly mano = viewChild.required<ElementRef<HTMLSpanElement>>('mano');
  private temporizador: ReturnType<typeof setTimeout> | null = null;
  private readonly reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    // Reinicia el ciclo cada vez que cambia el objetivo.
    effect(() => {
      const id = this.objetivoId();
      this.detener();
      if (id) this.zone.runOutsideAngular(() => this.programarCiclo(id, 600));
    });
  }

  private programarCiclo(id: string, espera: number): void {
    this.temporizador = setTimeout(() => this.ciclo(id), espera);
  }

  private ciclo(id: string): void {
    const objetivo = document.getElementById(id);
    const el = this.mano().nativeElement;
    if (!objetivo) {
      // El elemento puede aparecer tarde (listas pintadas por JS): reintenta.
      this.programarCiclo(id, 800);
      return;
    }

    const r = objetivo.getBoundingClientRect();
    const destinoX = Math.min(r.left + Math.min(r.width * 0.7, 220), window.innerWidth - 30);
    const destinoY = r.top + r.height * 0.7;

    if (this.reduceMotion) {
      // Sin viaje: halo fijo sobre el objetivo.
      el.style.transition = 'none';
      el.style.transform = `translate(${destinoX}px, ${destinoY}px)`;
      el.classList.add('clic');
      return;
    }

    // Parte desde la zona de la chef (abajo a la derecha)
    el.classList.remove('clic');
    el.style.transition = 'none';
    el.style.transform = `translate(${window.innerWidth - 120}px, ${window.innerHeight - 160}px)`;
    el.style.opacity = '0';

    // Viaja al objetivo
    requestAnimationFrame(() => {
      el.style.transition = 'transform 1.3s cubic-bezier(.45,0,.25,1), opacity .4s ease';
      el.style.opacity = '1';
      el.style.transform = `translate(${destinoX}px, ${destinoY}px)`;
    });

    // Clic al llegar, pausa, y repite
    this.temporizador = setTimeout(() => {
      el.classList.add('clic');
      this.temporizador = setTimeout(() => {
        el.style.opacity = '0';
        el.classList.remove('clic');
        this.programarCiclo(id, 900);
      }, 1700);
    }, 1450);
  }

  private detener(): void {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = null;
  }

  ngOnDestroy(): void {
    this.detener();
  }
}
