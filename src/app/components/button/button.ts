import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Estilo base (sin display: lo decide `block`). Solo utilidades del tema Migo. */
const BASE =
  'items-center justify-center rounded-full border border-transparent font-body ' +
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
  '2xs': 'min-h-7 px-2.5 text-caption', // 28px
  xs: 'min-h-8 px-3 text-caption', // 32px
  sm: 'min-h-9 px-4 text-caption', // 36px
  md: 'min-h-11 px-5 text-sm', // 44px — único tamaño que cumple el target táctil ≥44px por sí solo
  lg: 'min-h-13 px-6 text-base', // 52px
  xl: 'min-h-14 px-7 text-lead', // 56px
  '2xl': 'min-h-16 px-8 text-h3', // 64px
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
        class="size-4 me-2 rounded-full border-2 border-current border-r-transparent animate-spin"
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
