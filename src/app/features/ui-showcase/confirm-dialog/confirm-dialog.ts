import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button } from '@components/button/button';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardFooter } from '@components/card/card-footer';
import { CardHeader } from '@components/card/card-header';
import { CardTitle } from '@components/card/card-title';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import { Icon } from '@components/icon/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
}

/**
 * Contenido de un diálogo de confirmación: un `migo-card`. Es el componente que abre `MigoDialog`
 * — él **es** el diálogo, el shell no aporta vista. Recibe el texto por `MIGO_DIALOG_DATA` y se
 * cierra con un booleano por `MigoDialogRef`. Vive en features (su contenido es de la app).
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, CardHeader, CardTitle, CardBody, CardFooter, Icon],
  template: `
    <migo-card>
      <migo-card-header>
        <migo-icon card-icon name="mat:warning" size="lg" color="brand" />
        <migo-card-title>{{ data.title }}</migo-card-title>
      </migo-card-header>

      <migo-card-body>{{ data.message }}</migo-card-body>

      <migo-card-footer>
        <button migo-button variant="ghost" (click)="ref.close(false)">Cancelar</button>
        <button migo-button (click)="ref.close(true)">Aceptar</button>
      </migo-card-footer>
    </migo-card>
  `,
})
export class ConfirmDialog {
  protected readonly ref = inject<MigoDialogRef<boolean>>(MigoDialogRef);
  protected readonly data = inject<ConfirmDialogData>(MIGO_DIALOG_DATA);
}
