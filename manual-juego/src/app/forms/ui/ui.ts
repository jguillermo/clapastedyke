import { Directive, computed, input } from '@angular/core';

/**
 * Form design recipes: attribute directives that apply
 * Tailwind utilities (over the forms-tokens.css tokens) to the host.
 * Flat DOM: they wrap nothing, so ids and structure stay
 * intactos para el juego (validación, cursor-guía, highlighted).
 */

/** Section card. */
@Directive({
  selector: '[uiCard]',
  host: {
    class:
      'block bg-sheet border border-line rounded-card p-5 shadow-card mb-3.5 transition-shadow hover:shadow-floating',
  },
})
export class UiCard {}

/** Group title (mono, uppercase, accent). */
@Directive({
  selector: '[uiGroupTitle]',
  host: {
    class: 'block font-mono text-[11px] tracking-[.12em] uppercase text-accent mb-3.5',
  },
})
export class UiGroupTitle {}

/** Explanatory subtext under a title. */
@Directive({
  selector: '[uiSub]',
  host: { class: 'block text-xs text-muted mb-3' },
})
export class UiSub {}

/** Field label row. */
@Directive({
  selector: '[uiLabel]',
  host: { class: 'flex flex-wrap items-center gap-2 mb-1.5 text-[13px] font-semibold text-ink' },
})
export class UiLabel {}

/** Required-field asterisk. */
@Directive({
  selector: '[uiReq]',
  host: { class: 'text-accent font-bold' },
})
export class UiReq {}

/** Optional-field mark. */
@Directive({
  selector: '[uiOpt]',
  host: { class: 'text-[11px] font-normal text-muted' },
})
export class UiOpt {}

/** Data-type pill (Text, Number…). */
@Directive({
  selector: '[uiPill]',
  host: {
    class:
      'font-mono text-[9.5px] uppercase tracking-wide text-muted border border-line rounded-pill px-2 py-px ml-auto',
  },
})
export class UiPill {}

/** Input field (input/select/textarea). Variants: calc, ro. */
@Directive({
  selector: '[uiField]',
  host: { '[class]': 'classes()' },
})
export class UiField {
  readonly uiField = input<'' | 'calc' | 'ro'>('');

  protected readonly classes = computed(() => {
    const base =
      'w-full font-body text-[13.5px] text-ink bg-sheet border border-line rounded-field px-3 py-2.5 outline-none transition ' +
      'focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-muted/70';
    switch (this.uiField()) {
      case 'calc':
        return `${base} bg-accent-soft border-accent-soft text-accent-deep font-mono font-bold`;
      case 'ro':
        return `${base} bg-paper text-muted`;
      default:
        return base;
    }
  });
}

/** Responsive field grid. */
@Directive({
  selector: '[uiGrid]',
  host: { '[class]': 'classes()' },
})
export class UiGrid {
  readonly uiGrid = input<'two' | 'three'>('two');

  protected readonly classes = computed(() =>
    this.uiGrid() === 'three'
      ? 'grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr] gap-2.5'
      : 'grid grid-cols-1 sm:grid-cols-2 gap-3',
  );
}

/** Botón. Variantes: primario, mini, peligro, fantasma; default = secundario. */
@Directive({
  selector: '[uiButton]',
  host: { '[class]': 'classes()' },
})
export class UiButton {
  readonly uiButton = input<'' | 'primary' | 'mini' | 'danger' | 'ghost'>('');

  protected readonly classes = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-1.5 font-body font-semibold cursor-pointer transition select-none ' +
      'active:translate-y-px disabled:opacity-55 disabled:cursor-default';
    switch (this.uiButton()) {
      case 'primary':
        return `${base} text-[13.5px] px-4.5 py-2.5 rounded-[9px] bg-accent border border-accent text-white hover:bg-accent-deep shadow-card`;
      case 'mini':
        return `${base} text-[11px] px-2.5 py-1 rounded-[7px] bg-sheet border border-line text-[#5d544b] hover:border-accent hover:text-accent`;
      case 'danger':
        return `${base} text-[11px] px-2.5 py-1 rounded-[7px] bg-sheet border border-red text-red hover:bg-red-soft`;
      case 'ghost':
        return `${base} text-[13.5px] px-1.5 py-2 bg-transparent border-0 text-accent hover:text-accent-deep`;
      default:
        return `${base} text-[13.5px] px-4.5 py-2.5 rounded-[9px] bg-sheet border border-line text-[#5d544b] hover:border-muted`;
    }
  });
}

/** Card toolbar (h4 title + action). */
@Directive({
  selector: '[uiToolbar]',
  host: { class: 'flex items-center justify-between gap-2.5 mb-3' },
})
export class UiToolbar {}

/** Title inside the toolbar. */
@Directive({
  selector: '[uiToolbarTitle]',
  host: { class: 'm-0 font-heading text-base font-semibold text-ink' },
})
export class UiToolbarTitle {}

/** Empty state ('Nothing yet…', 'Loading…'). */
@Directive({
  selector: '[uiEmpty]',
  host: { class: 'block p-4 text-center text-muted text-[13px]' },
})
export class UiEmpty {}

/** Nota al pie con fondo crema y borde punteado. */
@Directive({
  selector: '[uiNote]',
  host: {
    class:
      'block text-xs text-muted mt-1.5 px-3 py-2.5 bg-cream rounded-field border border-dashed border-line',
  },
})
export class UiNote {}

/** Flash notice (GAS JS toggles it; decorative and hidden here). */
@Directive({
  selector: '[uiFlash]',
  host: { class: 'hidden mb-3.5 px-3 py-2.5 rounded-field text-[13px]' },
})
export class UiFlash {}

/** Stock light dot. */
@Directive({
  selector: '[uiDot]',
  host: { '[class]': 'classes()' },
})
export class UiDot {
  readonly uiDot = input<'red' | 'yellow' | 'green'>('green');

  protected readonly classes = computed(() => {
    const color =
      this.uiDot() === 'red' ? 'bg-red' : this.uiDot() === 'yellow' ? 'bg-amber' : 'bg-green';
    return `inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${color}`;
  });
}

/** Every recipe, to import them at once in each form. */
export const UI_FORMS = [
  UiCard,
  UiGroupTitle,
  UiSub,
  UiLabel,
  UiReq,
  UiOpt,
  UiPill,
  UiField,
  UiGrid,
  UiButton,
  UiToolbar,
  UiToolbarTitle,
  UiEmpty,
  UiNote,
  UiFlash,
  UiDot,
] as const;
