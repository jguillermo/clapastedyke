import { A11yModule } from '@angular/cdk/a11y';
import { CdkListboxModule } from '@angular/cdk/listbox';
import { OverlayModule } from '@angular/cdk/overlay';
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

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

let nextSelectId = 0;

/**
 * Select (combobox) presentacional. El disparador abre, vía CDK Overlay, un panel con un
 * `cdkListbox` que aporta teclado (flechas, Home/End, type-ahead), roles ARIA y foco.
 * Implementa `ControlValueAccessor` (valor `string`), así que enchufa con Reactive Forms.
 * Si está dentro de `<app-form-field>`, toma de él id / `aria-describedby` / estado inválido.
 * Sin lógica de negocio.
 */
@Component({
  selector: 'app-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OverlayModule, CdkListboxModule, A11yModule],
  template: `
    <button
      #trigger
      type="button"
      class="app-select__trigger"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      [id]="controlId()"
      [disabled]="isDisabled()"
      aria-haspopup="listbox"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-label]="field ? null : ariaLabel() || null"
      [attr.aria-invalid]="isInvalid() ? true : null"
      [attr.aria-describedby]="describedBy()"
      (click)="toggle()"
    >
      <span
        class="app-select__value"
        [class.app-select__value--placeholder]="selectedLabel() === null"
      >
        {{ selectedLabel() ?? placeholder() }}
      </span>
      <span class="app-select__chevron" aria-hidden="true"></span>
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="isOpen()"
      [cdkConnectedOverlayWidth]="triggerWidth()"
      (overlayOutsideClick)="close()"
      (overlayKeydown)="onOverlayKeydown($event)"
      (detach)="close()"
    >
      <ul
        class="app-select__panel"
        cdkListbox
        cdkTrapFocus
        cdkTrapFocusAutoCapture
        [cdkListboxValue]="valueArray()"
        (cdkListboxValueChange)="onListboxChange($event.value)"
      >
        @for (option of options(); track option.value) {
          <li
            class="app-select__option"
            [cdkOption]="option.value"
            [cdkOptionDisabled]="option.disabled ?? false"
          >
            <span class="app-select__option-label">{{ option.label }}</span>
            <span class="app-select__option-check" aria-hidden="true"></span>
          </li>
        }
      </ul>
    </ng-template>
  `,
  styleUrl: './select.css',
  host: {
    class: 'app-select',
    '[class.app-select--invalid]': 'isInvalid()',
    '[class.app-select--disabled]': 'isDisabled()',
    '[class.app-select--open]': 'isOpen()',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true }],
})
export class Select implements ControlValueAccessor {
  protected readonly field = inject(FormField, { optional: true });

  readonly options = input<readonly SelectOption[]>([]);
  readonly placeholder = input('Selecciona…');
  readonly ariaLabel = input('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly fallbackId = `app-select-${nextSelectId++}`;

  private readonly selected = signal<string | null>(null);
  private readonly disabledByForm = signal(false);
  protected readonly isOpen = signal(false);
  protected readonly triggerWidth = signal(0);

  protected readonly controlId = computed(() => this.field?.controlId ?? this.fallbackId);
  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);
  protected readonly isInvalid = computed(() => (this.field?.invalid() ?? false) || this.invalid());
  protected readonly isDisabled = computed(() => this.disabledByForm() || this.disabled());

  /** `cdkListboxValue` espera un array; el valor seleccionado es de un solo elemento. */
  protected readonly valueArray = computed(() => {
    const value = this.selected();
    return value === null ? [] : [value];
  });

  /** `null` cuando no hay selección → el disparador muestra el placeholder. */
  protected readonly selectedLabel = computed(() => {
    const value = this.selected();
    return this.options().find((option) => option.value === value)?.label ?? null;
  });

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  protected toggle(): void {
    if (this.isDisabled()) {
      return;
    }
    if (this.isOpen()) {
      this.close();
      return;
    }
    this.triggerWidth.set(this.trigger().nativeElement.offsetWidth);
    this.isOpen.set(true);
  }

  protected close(): void {
    if (!this.isOpen()) {
      return;
    }
    this.isOpen.set(false);
    this.onTouched();
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  protected onListboxChange(value: readonly string[]): void {
    const next = value[0] ?? null;
    this.selected.set(next);
    this.onChange(next);
    this.close();
  }

  // ControlValueAccessor
  writeValue(value: string | null): void {
    this.selected.set(value ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }
}
