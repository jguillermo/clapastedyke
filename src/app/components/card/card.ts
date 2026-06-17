import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type CardVariant = 'elevated' | 'outlined' | 'filled';
export type CardElevation = 'sm' | 'md' | 'lg';

const ELEVATION_SHADOW: Record<CardElevation, string> = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

/**
 * Superficie/tarjeta presentacional. Es la pieza de maquetación del design system: se compone
 * con `migo-card-header`, `migo-card-title`, `migo-card-subtitle`, `migo-card-body` y
 * `migo-card-footer`. Agnóstica: sirve en cualquier página o lanzada como diálogo. Sin lógica.
 *
 * Uso:
 * ```html
 * <migo-card variant="elevated" elevation="md">
 *   <migo-card-header>
 *     <migo-icon card-icon name="mat:layers" size="lg" />
 *     <migo-card-title>Título</migo-card-title>
 *   </migo-card-header>
 *   <migo-card-body>…</migo-card-body>
 *   <migo-card-footer><button migo-button>OK</button></migo-card-footer>
 * </migo-card>
 * ```
 */
@Component({
  selector: 'migo-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[class]': 'hostClasses()',
    '[attr.tabindex]': 'interactive() ? 0 : null',
  },
})
export class Card {
  readonly variant = input<CardVariant>('elevated');
  readonly elevation = input<CardElevation>('md');
  readonly interactive = input(false, { transform: booleanAttribute });
  /**
   * Mobile-first: hace que el card **llene** su contenedor (típicamente un diálogo) —
   * columna a toda altura con el `migo-card-body` como única zona scrollable y
   * header/footer fijos. Full-bleed sin radio en móvil, con radio en `sm+`.
   * Ver mobile-first-conventions.md.
   */
  readonly fill = input(false, { transform: booleanAttribute });

  protected readonly hostClasses = computed(() => {
    const parts = [
      'overflow-hidden',
      this.fill()
        ? 'flex flex-1 flex-col min-h-0 rounded-none sm:rounded-xl'
        : 'block rounded-xl',
    ];
    switch (this.variant()) {
      case 'outlined':
        parts.push('bg-surface-card border border-border-subtle');
        break;
      case 'filled':
        parts.push('bg-surface-sunken');
        break;
      default:
        parts.push('bg-surface-card', ELEVATION_SHADOW[this.elevation()]);
    }
    if (this.interactive()) {
      parts.push(
        'cursor-pointer transition duration-base ease-out hover:shadow-lg hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:shadow-focus',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
      );
    }
    return parts.join(' ');
  });
}
