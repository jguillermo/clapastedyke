import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardHeader } from '@components/card/card-header';
import { CardTitle } from '@components/card/card-title';
import { Button } from '@components/button/button';
import { Icon } from '@components/icon/icon';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import type { Supply } from '@core/recipe-book/domain/entities/supply';
import { SupplyList } from '../supply-list/supply-list';

/** Datos del diálogo de Insumos: el catálogo actual (ya cargado por el libro). */
export interface SuppliesDialogData {
  supplies: readonly Supply[];
}

/**
 * Shell de diálogo para gestionar los Insumos: hospeda la lista editable
 * {@link SupplyList} (que se autoguarda) dentro de un `migo-card fill`. Al cerrar
 * devuelve `true` si hubo cambios, para que el libro recargue.
 */
@Component({
  selector: 'app-supplies-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, CardHeader, CardTitle, CardBody, Button, Icon, SupplyList],
  // `contents`: el card `fill` es hijo flex directo del diálogo y llena la pantalla en móvil.
  host: { class: 'contents' },
  template: `
    <migo-card fill>
      <migo-card-header>
        <migo-icon card-icon name="mat:layers" size="lg" color="brand" />
        <migo-card-title>Insumos</migo-card-title>
        <button card-actions migo-button variant="ghost" type="button" aria-label="Cerrar" (click)="close()">
          <migo-icon icon-leading name="mat:close" size="sm" />
        </button>
      </migo-card-header>

      <migo-card-body>
        <app-supply-list [supplies]="data.supplies" (changed)="changed.set(true)" />
      </migo-card-body>
    </migo-card>
  `,
})
export class SuppliesDialog {
  protected readonly ref = inject<MigoDialogRef<boolean>>(MigoDialogRef);
  protected readonly data = inject<SuppliesDialogData>(MIGO_DIALOG_DATA);
  protected readonly changed = signal(false);

  protected close(): void {
    this.ref.close(this.changed());
  }
}
