import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormField } from '@components/form-field/form-field';

let nextUnitInputId = 0;

/** Caja con aspecto de input; el borde/anillo de foco varía según validez. */
const BOX_BASE =
  'flex items-center gap-1 w-full min-h-11 box-border px-4 rounded-md bg-surface-card border ' +
  'font-body text-base text-body cursor-text transition duration-base ease-out ' +
  'hover:border-border-strong has-[:disabled]:bg-surface-sunken has-[:disabled]:text-muted ' +
  'has-[:disabled]:cursor-not-allowed motion-reduce:transition-none';

/** Unidades que el usuario puede fijar tecleando su inicial. */
export type UnitToken = 'k' | 'g' | 'u';

/**
 * Campo numérico con la **unidad mostrada dentro del input, junto al número** que
 * se escribe (no al costado). El número crece con el contenido (`field-sizing`)
 * y la unidad lo sigue de inmediato. Presentacional: la **unidad la calcula el
 * consumidor** (a partir del dominio) y se pasa por `unit` — el componente no
 * interpreta ni convierte nada.
 *
 * El **valor (CVA) es solo el número**: las letras no se escriben. Teclear `k`/`g`
 * /`u` no inserta nada, sino que emite `unitToken` para que el consumidor fije la
 * unidad (y actualice `unit`). Así "8u" se ve como `8` con el chip `u`, no `8 u`.
 *
 * Implementa `ControlValueAccessor` (valor `string` numérico), enchufa con Reactive
 * Forms. Si está dentro de `<migo-form-field>`, toma de él id / `aria-describedby` /
 * estado inválido. Sin lógica de negocio.
 */
@Component({
  selector: 'migo-unit-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="boxClasses()" (mousedown)="focusFromBox($event)">
      <input
        #control
        class="field-sizing-content min-w-6 max-w-full bg-transparent border-0 p-0 font-body text-base text-body placeholder:text-placeholder focus:outline-none disabled:cursor-not-allowed"
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
      @if (unit() && value()) {
        <span class="shrink-0 text-base text-muted select-none" aria-hidden="true">{{ unit() }}</span>
      }
    </span>
  `,
  host: { class: 'block' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UnitInput), multi: true },
  ],
})
export class UnitInput implements ControlValueAccessor {
  /** Campo contenedor opcional: aporta label, id y relación ARIA. */
  protected readonly field = inject(FormField, { optional: true });

  /** Unidad a mostrar junto al número (la resuelve el consumidor: `kg`, `g`, `u`…). */
  readonly unit = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Se emite cuando el usuario teclea la inicial de una unidad (`k`/`g`/`u`). */
  readonly unitToken = output<UnitToken>();

  /** Variante sin borde/fondo para incrustarse en una celda de grilla. */
  readonly seamless = input(false, { transform: booleanAttribute });

  /** Variante "papel": como `seamless` pero con renglón inferior y realce cálido del libro. */
  readonly paper = input(false, { transform: booleanAttribute });

  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');
  private readonly fallbackId = `migo-unit-input-${nextUnitInputId++}`;
  protected readonly value = signal('');
  private readonly disabledByForm = signal(false);

  protected readonly controlId = computed(() => this.field?.controlId ?? this.fallbackId);
  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);
  protected readonly isInvalid = computed(() => (this.field?.invalid() ?? false) || this.invalid());
  protected readonly isDisabled = computed(() => this.disabledByForm() || this.disabled());

  protected readonly boxClasses = computed(() => {
    if (this.paper()) {
      const base =
        'flex items-center gap-1 w-full min-h-11 box-border px-3 bg-transparent font-body text-base ' +
        'cursor-text transition duration-base ease-out border-b border-border-subtle ' +
        'focus-within:bg-surface-warm motion-reduce:transition-none';
      return this.isInvalid() ? `${base} text-error` : `${base} text-body`;
    }
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

  /** Intercepta letras: `k`/`g`/`u` fijan la unidad (emiten token); el resto se bloquea. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key.length !== 1 || !/[a-zA-Z]/.test(event.key)) {
      return; // dígitos, separadores, teclas de control y navegación pasan
    }
    event.preventDefault();
    const key = event.key.toLowerCase();
    if (key === 'k' || key === 'g' || key === 'u') {
      this.unitToken.emit(key);
    }
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = sanitizeNumber(input.value);
    if (sanitized !== input.value) {
      input.value = sanitized; // descarta lo pegado que no sea numérico
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
function sanitizeNumber(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, '');
  const firstSeparator = cleaned.search(/[.,]/);
  if (firstSeparator === -1) {
    return cleaned;
  }
  const head = cleaned.slice(0, firstSeparator + 1);
  const tail = cleaned.slice(firstSeparator + 1).replace(/[.,]/g, '');
  return head + tail;
}
