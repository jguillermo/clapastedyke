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
 * <app-form-field label="Email" [error]="emailError()">
 *   <app-input type="email" formControlName="email" />
 * </app-form-field>
 * ```
 */
@Component({
  selector: 'app-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label()) {
      <label class="app-field__label" [attr.for]="controlId">
        {{ label() }}
        @if (required()) {
          <span class="app-field__req" aria-hidden="true">*</span>
        }
      </label>
    }

    <div class="app-field__control">
      <ng-content />
    </div>

    @if (error()) {
      <p class="app-field__msg app-field__msg--error" [id]="errorId" role="alert">
        {{ error() }}
      </p>
    } @else if (hint()) {
      <p class="app-field__msg app-field__msg--hint" [id]="hintId">{{ hint() }}</p>
    }
  `,
  styleUrl: './form-field.css',
  host: { class: 'app-field' },
})
export class FormField {
  readonly label = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly required = input(false, { transform: booleanAttribute });

  /** Id único compartido por el `<label>` y el control hijo. */
  readonly controlId = `app-field-${nextFieldId++}`;
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
