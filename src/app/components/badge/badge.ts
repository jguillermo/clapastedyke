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
      `inline-flex w-fit items-center rounded-full bg-surface-sunken font-body text-xs font-medium text-muted ${SIZES[this.size()]}`,
  );
}
