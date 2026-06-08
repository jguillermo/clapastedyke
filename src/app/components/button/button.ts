import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Estilo base (sin display: lo decide `block`). Solo utilidades del tema Migo. */
const BASE =
  'items-center justify-center gap-2 rounded-full border border-transparent font-body ' +
  'font-semibold leading-none no-underline cursor-pointer select-none transition duration-base ' +
  'ease-out active:translate-y-px focus-visible:outline-none focus-visible:shadow-focus ' +
  'disabled:opacity-55 disabled:cursor-not-allowed motion-reduce:transition-none';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand hover:bg-brand-hover',
  secondary: 'bg-surface-card border-border-strong text-body hover:bg-surface-sunken',
  ghost: 'bg-transparent text-body hover:bg-surface-sunken',
  danger: 'bg-error text-on-brand hover:bg-error-hover',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-4 text-caption',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-13 px-6 text-base',
};

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
      <span
        class="size-4 rounded-full border-2 border-current border-r-transparent animate-spin"
        aria-hidden="true"
      ></span>
    }
    <ng-content select="[icon-leading]" />
    <span class="inline-flex items-center" [class.opacity-70]="loading()"><ng-content /></span>
    <ng-content select="[icon-trailing]" />
  `,
  host: {
    '[class]': 'hostClasses()',
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

  protected readonly hostClasses = computed(() =>
    [
      this.block() ? 'flex w-full' : 'inline-flex',
      BASE,
      VARIANTS[this.variant()],
      SIZES[this.size()],
    ].join(' '),
  );
}
