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

let nextCheckboxId = 0;

/**
 * Checkbox presentacional. Implementa `ControlValueAccessor` (valor booleano), así que
 * enchufa con Reactive Forms / `ngModel`. La etiqueta es el contenido proyectado.
 * Si está dentro de `<app-form-field>`, toma de él el `aria-describedby` / estado inválido.
 * Sin lógica de negocio.
 */
@Component({
  selector: 'app-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="app-check">
      <input
        class="app-check__input"
        type="checkbox"
        [id]="controlId()"
        [checked]="checked()"
        [indeterminate]="indeterminate()"
        [disabled]="isDisabled()"
        [attr.aria-invalid]="isInvalid() ? true : null"
        [attr.aria-describedby]="describedBy()"
        (change)="onToggle($event)"
        (blur)="onBlur()"
      />
      <span class="app-check__box" aria-hidden="true">
        <svg class="app-check__tick" viewBox="0 0 16 16" fill="none">
          <path
            d="M3.5 8.5l3 3 6-7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span class="app-check__label"><ng-content /></span>
    </label>
  `,
  styleUrl: './checkbox.css',
  host: {
    class: 'app-checkbox',
    '[class.app-checkbox--invalid]': 'isInvalid()',
    '[class.app-checkbox--disabled]': 'isDisabled()',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Checkbox), multi: true }],
})
export class Checkbox implements ControlValueAccessor {
  protected readonly field = inject(FormField, { optional: true });

  /** Muestra el estado "parcial" (visual); no cambia el valor del control. */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly fallbackId = `app-checkbox-${nextCheckboxId++}`;
  protected readonly checked = signal(false);
  private readonly disabledByForm = signal(false);

  protected readonly controlId = computed(() => this.field?.controlId ?? this.fallbackId);
  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);
  protected readonly isInvalid = computed(() => (this.field?.invalid() ?? false) || this.invalid());
  protected readonly isDisabled = computed(() => this.disabledByForm() || this.disabled());

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  protected onToggle(event: Event): void {
    const next = (event.target as HTMLInputElement).checked;
    this.checked.set(next);
    this.onChange(next);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  // ControlValueAccessor
  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }
}
