import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormField } from '@components/form-field/form-field';

let nextCurrencyInputId = 0;

/** Caja con aspecto de input; el borde/anillo de foco varía según validez. */
const BOX_BASE =
  'flex items-center gap-1 w-full min-h-11 box-border px-4 rounded-md bg-surface-card border ' +
  'font-body text-base text-body cursor-text transition duration-base ease-out ' +
  'hover:border-border-strong has-[:disabled]:bg-surface-sunken has-[:disabled]:text-muted ' +
  'has-[:disabled]:cursor-not-allowed motion-reduce:transition-none';

/**
 * Campo numérico monetario: muestra el **símbolo de moneda** como prefijo ghost
 * (siempre visible, color `text-muted`) seguido del input. Solo admite dígitos y
 * un único separador decimal (`,` o `.`); cualquier otro carácter se bloquea o
 * sanitiza al pegar. Sin lógica de negocio.
 *
 * Implementa `ControlValueAccessor` (valor `string` numérico). Si está dentro de
 * `<migo-form-field>`, toma de él id / `aria-describedby` / estado inválido.
 * Variante `seamless` para incrustarse en celdas de grilla.
 */
@Component({
  selector: 'migo-currency-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="boxClasses()" (mousedown)="focusFromBox($event)">
      @if (symbol()) {
        <span class="shrink-0 text-base text-muted select-none" aria-hidden="true">{{ symbol() }}</span>
      }
      <input
        #control
        class="field-sizing-content min-w-10 max-w-full bg-transparent border-0 p-0 font-body text-base text-body placeholder:text-placeholder focus:outline-none disabled:cursor-not-allowed"
        type="text"
        inputmode="decimal"
        [id]="controlId()"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [attr.aria-label]="field ? null : ariaLabel() || null"
        [attr.aria-invalid]="isInvalid() ? true : null"
        [attr.aria-describedby]="describedBy()"
        (keydown)="onKeydown($event)"
        (input)="onInput($event)"
        (blur)="onBlur()"
      />
    </span>
  `,
  host: { class: 'block' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CurrencyInput), multi: true },
  ],
})
export class CurrencyInput implements ControlValueAccessor {
  /** Campo contenedor opcional: aporta label, id y relación ARIA. */
  protected readonly field = inject(FormField, { optional: true });

  /** Símbolo de moneda mostrado como prefijo (ej. `'S/'`). */
  readonly symbol = input('S/');
  readonly placeholder = input('0.00');
  readonly ariaLabel = input('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Variante sin borde/fondo para incrustarse en una celda de grilla. */
  readonly seamless = input(false, { transform: booleanAttribute });

  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');
  private readonly fallbackId = `migo-currency-input-${nextCurrencyInputId++}`;
  protected readonly value = signal('');
  private readonly disabledByForm = signal(false);

  protected readonly controlId = computed(() => this.field?.controlId ?? this.fallbackId);
  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);
  protected readonly isInvalid = computed(() => (this.field?.invalid() ?? false) || this.invalid());
  protected readonly isDisabled = computed(() => this.disabledByForm() || this.disabled());

  protected readonly boxClasses = computed(() => {
    if (this.seamless()) {
      const base =
        'flex items-center gap-1 w-full min-h-11 box-border px-3 bg-transparent font-body text-base ' +
        'cursor-text transition duration-base ease-out focus-within:bg-surface-sunken motion-reduce:transition-none';
      return this.isInvalid() ? `${base} text-error` : `${base} text-body`;
    }
    return this.isInvalid()
      ? `${BOX_BASE} border-error focus-within:border-error focus-within:shadow-focus-error`
      : `${BOX_BASE} border-border-subtle focus-within:border-brand focus-within:shadow-focus`;
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** Clic en la caja (no en el input) → enfoca el input sin perder el caret. */
  protected focusFromBox(event: MouseEvent): void {
    if (event.target !== this.control().nativeElement) {
      event.preventDefault();
      this.control().nativeElement.focus();
    }
  }

  /** Permite dígitos y un separador decimal; bloquea todo lo demás. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key.length !== 1) return; // teclas de control, navegación, etc.
    if (/[\d.,]/.test(event.key)) return; // dígitos y separadores pasan
    event.preventDefault();
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = sanitizeCurrency(input.value);
    if (sanitized !== input.value) {
      input.value = sanitized;
    }
    this.value.set(sanitized);
    this.onChange(sanitized);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  // ControlValueAccessor
  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }
}

/** Conserva solo dígitos y un único separador decimal (`,` o `.`). */
function sanitizeCurrency(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, '');
  const firstSeparator = cleaned.search(/[.,]/);
  if (firstSeparator === -1) {
    return cleaned;
  }
  const head = cleaned.slice(0, firstSeparator + 1);
  const tail = cleaned.slice(firstSeparator + 1).replace(/[.,]/g, '');
  return head + tail;
}
