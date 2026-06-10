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
import { Icon } from '@components/icon/icon';

let nextCheckboxId = 0;

/** Caja visual. El input nativo es `peer sr-only`: el foco/checked llegan vía variantes peer-*. */
const BOX_BASE =
  'relative inline-flex items-center justify-center shrink-0 size-5 rounded-sm text-on-brand ' +
  'border transition duration-base ease-out motion-reduce:transition-none ' +
  'peer-checked:bg-brand peer-checked:border-brand peer-indeterminate:bg-brand ' +
  'peer-indeterminate:border-brand peer-focus-visible:outline-none peer-focus-visible:shadow-focus';

/**
 * Checkbox presentacional. Implementa `ControlValueAccessor` (valor booleano), así que
 * enchufa con Reactive Forms / `ngModel`. La etiqueta es el contenido proyectado.
 * Si está dentro de `<migo-form-field>`, toma de él el `aria-describedby` / estado inválido.
 * Sin lógica de negocio.
 */
@Component({
  selector: 'migo-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <label [class]="labelClasses()">
      <input
        class="peer sr-only"
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
      <span [class]="boxClasses()" aria-hidden="true">
        @if (indeterminate()) {
          <span class="w-2.5 h-0.5 rounded-full bg-on-brand"></span>
        } @else {
          <migo-icon
            name="mat:check"
            size="xs"
            class="opacity-0 transition-opacity duration-fast ease-out motion-reduce:transition-none"
            [class.opacity-100]="checked()"
          />
        }
      </span>
      <span><ng-content /></span>
    </label>
  `,
  host: { class: 'inline-block' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Checkbox), multi: true }],
})
export class Checkbox implements ControlValueAccessor {
  protected readonly field = inject(FormField, { optional: true });

  /** Muestra el estado "parcial" (visual); no cambia el valor del control. */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly fallbackId = `migo-checkbox-${nextCheckboxId++}`;
  protected readonly checked = signal(false);
  private readonly disabledByForm = signal(false);

  protected readonly controlId = computed(() => this.field?.controlId ?? this.fallbackId);
  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);
  protected readonly isInvalid = computed(() => (this.field?.invalid() ?? false) || this.invalid());
  protected readonly isDisabled = computed(() => this.disabledByForm() || this.disabled());

  protected readonly labelClasses = computed(() => {
    const base = 'inline-flex items-center gap-2 min-h-11 font-body text-base';
    return this.isDisabled()
      ? `${base} cursor-not-allowed text-muted`
      : `${base} cursor-pointer text-body`;
  });

  protected readonly boxClasses = computed(() => {
    if (this.isDisabled()) {
      return `${BOX_BASE} bg-surface-sunken border-border-subtle`;
    }
    if (this.isInvalid()) {
      return `${BOX_BASE} bg-surface-card border-error`;
    }
    return `${BOX_BASE} bg-surface-card border-border-strong`;
  });

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
