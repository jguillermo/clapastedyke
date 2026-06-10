import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormField } from '@components/form-field/form-field';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';

let nextInputId = 0;

/** Estilo del control nativo. El borde/anillo de foco varía según validez. */
const CONTROL_BASE =
  'w-full min-h-11 box-border px-4 rounded-md bg-surface-card border font-body text-base ' +
  'text-body transition duration-base ease-out placeholder:text-placeholder ' +
  'hover:border-border-strong focus:outline-none disabled:bg-surface-sunken ' +
  'disabled:text-muted disabled:cursor-not-allowed motion-reduce:transition-none';

/**
 * Control de texto presentacional. Implementa `ControlValueAccessor`, así que enchufa
 * directamente con Reactive Forms (`formControlName`, `[formControl]`) o `ngModel`.
 *
 * Si está dentro de `<migo-form-field>`, toma de él el `id` / `aria-describedby` / estado
 * inválido. Standalone, usar `ariaLabel` para accesibilidad. Sin lógica de negocio.
 */
@Component({
  selector: 'migo-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      [class]="controlClasses()"
      [id]="controlId()"
      [type]="type()"
      [value]="value()"
      [placeholder]="placeholder()"
      [disabled]="isDisabled()"
      [attr.aria-label]="field ? null : ariaLabel() || null"
      [attr.aria-invalid]="isInvalid() ? true : null"
      [attr.aria-describedby]="describedBy()"
      (input)="onInput($event)"
      (blur)="onBlur()"
    />
  `,
  host: { class: 'block' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputField), multi: true },
  ],
})
export class InputField implements ControlValueAccessor {
  /** Campo contenedor opcional: aporta label, id y relación ARIA. */
  protected readonly field = inject(FormField, { optional: true });

  readonly type = input<InputType>('text');
  readonly placeholder = input('');
  /** Etiqueta accesible cuando se usa sin `migo-form-field`. */
  readonly ariaLabel = input('');
  /** Fuerza el estado inválido sin un `migo-form-field` que lo provea. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Deshabilita el control en uso standalone (con forms, lo gestiona el FormControl). */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly fallbackId = `migo-input-${nextInputId++}`;
  protected readonly value = signal('');
  private readonly disabledByForm = signal(false);

  protected readonly controlId = computed(() => this.field?.controlId ?? this.fallbackId);
  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);
  protected readonly isInvalid = computed(() => (this.field?.invalid() ?? false) || this.invalid());
  protected readonly isDisabled = computed(() => this.disabledByForm() || this.disabled());

  protected readonly controlClasses = computed(() =>
    this.isInvalid()
      ? `${CONTROL_BASE} border-error focus:border-error focus:shadow-focus-error`
      : `${CONTROL_BASE} border-border-subtle focus:border-brand focus:shadow-focus`,
  );

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
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
