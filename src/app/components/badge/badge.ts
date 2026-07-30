import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeSize = 'xs' | 'sm';

/** Mapa de tamaño → padding del tema. Literales: Tailwind solo emite clases escritas. */
const SIZES: Record<BadgeSize, string> = {
  xs: 'px-2 py-0.5',
  sm: 'px-3 py-1',
};

/**
 * Píldora presentacional para una característica corta (p.ej. el sabor o el tamaño de una
 * receta). Contenido proyectado, sin lógica ni CVA (no es un control de formulario).
 * `size`: `sm` (default) | `xs` (más compacta, para varias juntas bajo un título).
 *
 * **Es un dato secundario**: se dibuja con contorno y SIN relleno, para que se vea el fondo a
 * través y no sobresalga (con relleno claro «flotaba» sobre el papel del libro 3D). Por eso el
 * texto va en `text-body` y no en `text-muted`: sin relleno propio, la píldora hereda el fondo que
 * tenga debajo, y `text-muted` sobre el papel del libro se queda en 3.9:1 — por debajo del 4.5:1
 * de WCAG AA. La jerarquía la marcan el tamaño (`text-xs`) y el peso, no el color de relleno.
 *
 * Uso: `<migo-badge>Vainilla</migo-badge>` · `<migo-badge size="xs">Porciones: 40</migo-badge>`
 */
@Component({
  selector: 'migo-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: { '[class]': 'hostClasses()' },
})
export class Badge {
  readonly size = input<BadgeSize>('sm');

  protected readonly hostClasses = computed(
    () =>
      `inline-flex w-fit items-center rounded-full border border-border-strong font-body text-xs text-body ${SIZES[this.size()]}`,
  );
}
