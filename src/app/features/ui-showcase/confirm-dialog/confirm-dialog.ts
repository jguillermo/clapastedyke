import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button } from '@components/button/button';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardFooter } from '@components/card/card-footer';
import { CardHeader } from '@components/card/card-header';
import { CardTitle } from '@components/card/card-title';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';

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
  imports: [Button, Card, CardHeader, CardTitle, CardBody, CardFooter],
  template: `
    <migo-card>
      <migo-card-header>
        <svg card-icon viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 8v5m0 3h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
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
