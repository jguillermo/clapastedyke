import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Botón presentacional agnóstico. Atributo sobre `<button>`/`<a>` nativos para
 * conservar la semántica accesible. Sin lógica de negocio: solo estilo + estado de UI.
 *
 * Uso: `<button migo-button variant="primary" size="md" [loading]="saving()">Guardar</button>`
 * Slots: `[icon-leading]`, contenido por defecto (label), `[icon-trailing]`.
 */
@Component({
  selector: 'button[migo-button], a[migo-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <span class="migo-btn__spinner" aria-hidden="true"></span>
    }
    <ng-content select="[icon-leading]" />
    <span class="migo-btn__label"><ng-content /></span>
    <ng-content select="[icon-trailing]" />
  `,
  styleUrl: './button.css',
  host: {
    class: 'migo-btn',
    '[class.migo-btn--primary]': "variant() === 'primary'",
    '[class.migo-btn--secondary]': "variant() === 'secondary'",
    '[class.migo-btn--ghost]': "variant() === 'ghost'",
    '[class.migo-btn--danger]': "variant() === 'danger'",
    '[class.migo-btn--sm]': "size() === 'sm'",
    '[class.migo-btn--md]': "size() === 'md'",
    '[class.migo-btn--lg]': "size() === 'lg'",
    '[class.migo-btn--block]': 'block()',
    '[class.migo-btn--loading]': 'loading()',
    '[attr.disabled]': "disabled() || loading() ? '' : null",
    '[attr.aria-disabled]': 'disabled() || loading() ? true : null',
    '[attr.aria-busy]': 'loading() ? true : null',
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly block = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
}
