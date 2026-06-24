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

let nextAutocompleteId = 0;

/** Estilo común del control; el borde/padding cambian con `seamless`. */
const CONTROL_COMMON =
  'w-full min-h-11 box-border bg-transparent font-body text-base transition duration-base ease-out ' +
  'placeholder:text-placeholder focus:outline-none disabled:bg-surface-sunken disabled:text-muted ' +
  'disabled:cursor-not-allowed motion-reduce:transition-none';

/**
 * Control de texto con **autocompletado fantasma en línea**: al escribir, el resto
 * de la primera sugerencia que coincide aparece tenue dentro del propio campo; se
 * acepta con Tab, → (cursor al final) o Enter. Sin desplegable ni overlay.
 *
 * Presentacional: las sugerencias se pasan por `suggestions` (el consumidor las
 * obtiene del dominio); el componente no conoce su origen. Implementa
 * `ControlValueAccessor` (valor `string`) y se integra con `<migo-form-field>`.
 */
@Component({
  selector: 'migo-autocomplete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="relative block">
      @if (ghostSuffix()) {
        <span [class]="ghostClasses()" aria-hidden="true">
          <span class="invisible">{{ value() }}</span><span class="text-placeholder">{{ ghostSuffix() }}</span>
        </span>
      }
      <input
        #control
        class="relative {{ controlClasses() }}"
        type="text"
        autocomplete="off"
        aria-autocomplete="inline"
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
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Autocomplete), multi: true },
  ],
})
export class Autocomplete implements ControlValueAccessor {
  protected readonly field = inject(FormField, { optional: true });

  readonly suggestions = input<readonly string[]>([]);
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Variante sin borde/fondo para incrustarse en una celda de grilla. */
  readonly seamless = input(false, { transform: booleanAttribute });
  /** Variante "papel": como `seamless` pero con renglón inferior y realce cálido del libro. */
  readonly paper = input(false, { transform: booleanAttribute });

  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');
  private readonly fallbackId = `migo-autocomplete-${nextAutocompleteId++}`;
  protected readonly value = signal('');
  private readonly disabledByForm = signal(false);

  protected readonly controlId = computed(() => this.field?.controlId ?? this.fallbackId);
  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);
  protected readonly isInvalid = computed(() => (this.field?.invalid() ?? false) || this.invalid());
  protected readonly isDisabled = computed(() => this.disabledByForm() || this.disabled());

  protected readonly controlClasses = computed(() => {
    if (this.paper()) {
      const base = `${CONTROL_COMMON} px-3 border-x-0 border-t-0 border-b border-border-subtle rounded-none focus:bg-surface-warm`;
      return this.isInvalid() ? `${base} text-error` : `${base} text-body`;
    }
    if (this.seamless()) {
      const base = `${CONTROL_COMMON} px-3 border-0 rounded-none focus:bg-surface-sunken`;
      return this.isInvalid() ? `${base} text-error` : `${base} text-body`;
    }
    const base = `${CONTROL_COMMON} px-4 border rounded-md text-body hover:border-border-strong`;
    return this.isInvalid()
      ? `${base} border-error focus:border-error focus:shadow-focus-error`
      : `${base} border-border-subtle focus:border-brand focus:shadow-focus`;
  });

  /** El fantasma debe replicar el padding/borde del control para alinearse. */
  protected readonly ghostClasses = computed(() => {
    const pad = this.seamless() || this.paper() ? 'px-3' : 'px-4';
    const border = this.paper()
      ? 'border-x-0 border-t-0 border-b border-transparent'
      : this.seamless()
        ? ''
        : 'border border-transparent';
    return `absolute inset-0 flex items-center ${pad} ${border} box-border font-body text-base whitespace-pre pointer-events-none`;
  });

  /** La sugerencia que mejor coincide con lo tecleado (prefijo, case-insensitive). */
  private readonly bestMatch = computed(() => {
    const typed = this.value().trim();
    if (!typed) return null;
    const lower = typed.toLowerCase();
    return this.suggestions().find((s) => s.toLowerCase().startsWith(lower) && s.length > typed.length) ?? null;
  });

  /** El sufijo tenue que se pinta tras el texto del usuario. */
  protected readonly ghostSuffix = computed(() => {
    const match = this.bestMatch();
    return match ? match.slice(this.value().length) : '';
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected onKeydown(event: KeyboardEvent): void {
    const match = this.bestMatch();
    if (!match) {
      return;
    }
    const input = this.control().nativeElement;
    const caretAtEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
    const accepts =
      event.key === 'Enter' ||
      (event.key === 'Tab' && !event.shiftKey) ||
      (event.key === 'ArrowRight' && caretAtEnd);
    if (!accepts) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.commit(match);
  }

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  /** Acepta la sugerencia completa (respeta su capitalización) y deja el caret al final. */
  private commit(match: string): void {
    this.value.set(match);
    this.onChange(match);
    const input = this.control().nativeElement;
    input.value = match;
    input.setSelectionRange(match.length, match.length);
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
