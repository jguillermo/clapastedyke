import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CardVariant = 'elevated' | 'outlined' | 'filled';
export type CardElevation = 'sm' | 'md' | 'lg';

/**
 * Superficie/tarjeta presentacional. Es la pieza de maquetación del design system: se compone
 * con `migo-card-header`, `migo-card-title`, `migo-card-subtitle`, `migo-card-body` y
 * `migo-card-footer`. Agnóstica: sirve en cualquier página o lanzada como diálogo. Sin lógica.
 *
 * Uso:
 * ```html
 * <migo-card variant="elevated" elevation="md">
 *   <migo-card-header>
 *     <svg card-icon>…</svg>
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
  styleUrl: './card.css',
  host: {
    class: 'migo-card',
    '[class.migo-card--elevated]': "variant() === 'elevated'",
    '[class.migo-card--outlined]': "variant() === 'outlined'",
    '[class.migo-card--filled]': "variant() === 'filled'",
    '[class.migo-card--sm]': "elevation() === 'sm'",
    '[class.migo-card--md]': "elevation() === 'md'",
    '[class.migo-card--lg]': "elevation() === 'lg'",
    '[class.migo-card--interactive]': 'interactive()',
    '[attr.tabindex]': 'interactive() ? 0 : null',
  },
})
export class Card {
  readonly variant = input<CardVariant>('elevated');
  readonly elevation = input<CardElevation>('md');
  readonly interactive = input(false, { transform: booleanAttribute });
}
