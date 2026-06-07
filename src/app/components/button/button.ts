import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Botón presentacional agnóstico. Atributo sobre `<button>`/`<a>` nativos para
 * conservar la semántica accesible. Sin lógica de negocio: solo estilo + estado de UI.
 *
 * Uso: `<button app-button variant="primary" size="md" [loading]="saving()">Guardar</button>`
 * Slots: `[icon-leading]`, contenido por defecto (label), `[icon-trailing]`.
 */
@Component({
  selector: 'button[app-button], a[app-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <span class="app-btn__spinner" aria-hidden="true"></span>
    }
    <ng-content select="[icon-leading]" />
    <span class="app-btn__label"><ng-content /></span>
    <ng-content select="[icon-trailing]" />
  `,
  styleUrl: './button.css',
  host: {
    class: 'app-btn',
    '[class.app-btn--primary]': "variant() === 'primary'",
    '[class.app-btn--secondary]': "variant() === 'secondary'",
    '[class.app-btn--ghost]': "variant() === 'ghost'",
    '[class.app-btn--danger]': "variant() === 'danger'",
    '[class.app-btn--sm]': "size() === 'sm'",
    '[class.app-btn--md]': "size() === 'md'",
    '[class.app-btn--lg]': "size() === 'lg'",
    '[class.app-btn--block]': 'block()',
    '[class.app-btn--loading]': 'loading()',
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
