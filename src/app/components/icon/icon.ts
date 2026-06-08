import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICON_PATHS, IconName } from './icon.registry';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconColor =
  | 'current'
  | 'brand'
  | 'body'
  | 'heading'
  | 'muted'
  | 'accent'
  | 'fresh'
  | 'celebrate'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'on-brand';

const SIZES: Record<IconSize, string> = {
  xs: 'size-3.5', // 14px
  sm: 'size-4', // 16px
  md: 'size-5', // 20px
  lg: 'size-6', // 24px
  xl: 'size-8', // 32px
};

/** `current` hereda el color del texto del contenedor (vía `currentColor`). */
const COLORS: Record<IconColor, string> = {
  current: '',
  brand: 'text-brand',
  body: 'text-body',
  heading: 'text-heading',
  muted: 'text-muted',
  accent: 'text-accent',
  fresh: 'text-fresh',
  celebrate: 'text-celebrate',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
  'on-brand': 'text-on-brand',
};

/**
 * Icono presentacional del design system. Recibe el **nombre prefijado** de un icono registrado
 * en `icon.registry.ts` (`mat:check`, `custom:my-icon`…) y pinta su SVG con `size` y `color`
 * del tema Migo.
 *
 * El tamaño y el color viven en el `<svg>` interior; el consumidor puede poner clases de animación
 * (`opacity-*`, `rotate-*`, `transition-*`) en el `<migo-icon>` sin colisionar con el tamaño.
 *
 * Decorativo por defecto (`aria-hidden`). Con `ariaLabel` pasa a `role="img"` + `aria-label`.
 *
 * Uso: `<migo-icon name="mat:check" size="md" color="brand" />`
 */
@Component({
  selector: 'migo-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (path(); as d) {
      <svg
        [class]="svgClass()"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path [attr.d]="d" />
      </svg>
    }
  `,
  host: {
    class: 'inline-flex shrink-0',
    '[attr.role]': "ariaLabel() ? 'img' : null",
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-hidden]': "ariaLabel() ? null : 'true'",
  },
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<IconSize>('md');
  readonly color = input<IconColor>('current');
  /** Etiqueta accesible; si se da, el icono deja de ser decorativo. */
  readonly ariaLabel = input('');

  protected readonly path = computed(() => ICON_PATHS[this.name()]);
  protected readonly svgClass = computed(() =>
    `${SIZES[this.size()]} ${COLORS[this.color()]}`.trim(),
  );
}
