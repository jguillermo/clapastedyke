import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

let nextFieldId = 0;

/**
 * Contenedor presentacional de un campo de formulario: label + hint + error.
 * Genera los `id` y la relación ARIA (`for`, `aria-describedby`) y los expone al
 * control proyectado por DI (ver `InputField`). Sin lógica de negocio.
 *
 * Uso:
 * ```html
 * <migo-form-field label="Email" [error]="emailError()">
 *   <migo-input type="email" formControlName="email" />
 * </migo-form-field>
 * ```
 */
@Component({
  selector: 'migo-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label()) {
      <label class="font-body text-sm font-semibold text-body" [attr.for]="controlId">
        {{ label() }}
        @if (required()) {
          <span class="ms-1 text-accent" aria-hidden="true">*</span>
        }
      </label>
    }

    <div class="flex flex-col">
      <ng-content />
    </div>

    @if (error()) {
      <p
        class="m-0 text-caption leading-snug text-error font-medium"
        [id]="errorId"
        role="alert"
      >
        {{ error() }}
      </p>
    } @else if (hint()) {
      <p class="m-0 text-caption leading-snug text-muted" [id]="hintId">{{ hint() }}</p>
    }
  `,
  host: { class: 'flex flex-col gap-2' },
})
export class FormField {
  readonly label = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly required = input(false, { transform: booleanAttribute });

  /** Id único compartido por el `<label>` y el control hijo. */
  readonly controlId = `migo-field-${nextFieldId++}`;
  readonly hintId = `${this.controlId}-hint`;
  readonly errorId = `${this.controlId}-error`;

  /** El campo está en error cuando hay mensaje de error. */
  readonly invalid = computed(() => this.error().length > 0);

  /** Qué describe al control: el error si existe, si no la pista. */
  readonly describedBy = computed(() => {
    if (this.error()) {
      return this.errorId;
    }
    if (this.hint()) {
      return this.hintId;
    }
    return null;
  });
}
