import { Injectable } from '@angular/core';

/**
 * Sincroniza el **visual viewport** (el área realmente visible, que SÍ encoge cuando aparece el
 * teclado virtual) a variables CSS en `:root`, para que un diálogo full-bleed en móvil se ajuste
 * al espacio sobre el teclado en vez de quedar más alto que la pantalla y desplazarse.
 *
 * - `--vvh`: alto del área visible (`visualViewport.height`).
 * - `--vvt`: desplazamiento superior del área visible (`visualViewport.offsetTop`; iOS lo usa).
 *
 * Las consume el chrome del diálogo en `src/styles.css` (media query móvil). En escritorio o sin
 * teclado `--vvh` ≈ alto total y `--vvt` = 0, así que es inocuo. Mecanismo técnico transversal
 * (sin dominio) — vive en `platform/`. Ver mobile-first-conventions.md.
 */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  private frame = 0;

  /** Arranca el seguimiento. Idempotente y seguro si no existe `visualViewport` (jsdom/SSR). */
  start(): void {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) {
      return;
    }
    const sync = (): void => {
      // Coalesce ráfagas de eventos durante la animación del teclado en un solo write por frame.
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => {
        const root = document.documentElement.style;
        root.setProperty('--vvh', `${vv.height}px`);
        root.setProperty('--vvt', `${vv.offsetTop}px`);
      });
    };
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
  }
}
