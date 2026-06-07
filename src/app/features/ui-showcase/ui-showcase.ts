import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@components/button/button';
import { Checkbox } from '@components/checkbox/checkbox';
import { Dialog } from '@components/dialog/dialog';
import { FormField } from '@components/form-field/form-field';
import { InputField } from '@components/input/input';
import { Select, SelectOption } from '@components/select/select';

/**
 * Banco de pruebas / documentación viva de la librería de componentes (ruta /ui).
 * No es un componente de diseño: vive en features/ y compone los componentes agnósticos.
 */
@Component({
  selector: 'app-ui-showcase',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe, ReactiveFormsModule, Button, Checkbox, Dialog, FormField, InputField, Select],
  templateUrl: './ui-showcase.html',
  styleUrl: './ui-showcase.css',
})
export class UiShowcase {
  protected readonly dialogOpen = signal(false);
  protected readonly loadingDemo = signal(false);

  protected readonly countries: SelectOption[] = [
    { value: 'pe', label: 'Perú' },
    { value: 'es', label: 'España' },
    { value: 'de', label: 'Alemania' },
    { value: 'fr', label: 'Francia (no disponible)', disabled: true },
  ];

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    country: new FormControl<string | null>(null, { validators: [Validators.required] }),
    terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  protected readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected readonly emailValue = toSignal(this.form.controls.email.valueChanges, {
    initialValue: '',
  });

  protected toggleEmailDisabled(): void {
    const control = this.form.controls.email;
    if (control.disabled) {
      control.enable();
    } else {
      control.disable();
    }
  }

  protected simulateLoading(): void {
    this.loadingDemo.set(true);
    setTimeout(() => this.loadingDemo.set(false), 1500);
  }
}
