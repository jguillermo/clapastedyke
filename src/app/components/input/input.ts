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
      class="migo-input__control"
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
  styleUrl: './input.css',
  host: {
    class: 'migo-input',
    '[class.migo-input--invalid]': 'isInvalid()',
    '[class.migo-input--disabled]': 'isDisabled()',
  },
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
