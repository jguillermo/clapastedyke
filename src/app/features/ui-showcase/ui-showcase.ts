import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@components/button/button';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardFooter } from '@components/card/card-footer';
import { CardHeader } from '@components/card/card-header';
import { CardSubtitle } from '@components/card/card-subtitle';
import { CardTitle } from '@components/card/card-title';
import { Checkbox } from '@components/checkbox/checkbox';
import { MigoDialog } from '@components/dialog/dialog.service';
import { FormField } from '@components/form-field/form-field';
import { InputField } from '@components/input/input';
import { Select, SelectOption } from '@components/select/select';
import { ConfirmDialog } from './confirm-dialog/confirm-dialog';

/**
 * Banco de pruebas / documentación viva de la librería de componentes (ruta /ui).
 * No es un componente de diseño: vive en features/ y compone los componentes agnósticos.
 */
@Component({
  selector: 'app-ui-showcase',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardSubtitle,
    CardBody,
    CardFooter,
    Checkbox,
    FormField,
    InputField,
    Select,
  ],
  templateUrl: './ui-showcase.html',
  styleUrl: './ui-showcase.css',
})
export class UiShowcase {
  private readonly dialog = inject(MigoDialog);

  protected readonly loadingDemo = signal(false);
  protected readonly dialogResult = signal<boolean | null>(null);

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

  protected openConfirm(): void {
    const ref = this.dialog.open<boolean, unknown, ConfirmDialog>(ConfirmDialog, {
      ariaLabel: 'Confirmar acción',
      width: '480px',
      data: {
        title: '¿Confirmar acción?',
        message:
          'Este diálogo es un componente que abre MigoDialog en un CDK Overlay con focus-trap, ' +
          'bloqueo de scroll y cierre por ESC o backdrop. El foco vuelve al botón al cerrar.',
      },
    });
    ref.closed.subscribe((result) => this.dialogResult.set(result ?? false));
  }
}
