import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BaseUnit } from '@core/_common/quantity';
import { Button } from '@components/button/button';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardFooter } from '@components/card/card-footer';
import { CardHeader } from '@components/card/card-header';
import { CardTitle } from '@components/card/card-title';
import { CardSubtitle } from '@components/card/card-subtitle';
import { Icon } from '@components/icon/icon';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import type { IngredientUsage } from '@core/recipe-book/domain/value-objects/ingredient-usage';
import { PreviewIngredientCost } from '@core/recipe-book/application/use-cases/preview-ingredient-cost.use-case';
import { USAGE_LABELS } from '../_shared/ingredient-usage.labels';

/** Datos del diálogo de lectura de un insumo. */
export interface IngredientDetailData {
  name: string;
  usage: IngredientUsage;
  purchase: { amount: number; per: { value: number; unit: BaseUnit }; currency: string };
}

/** El usuario pidió editar este insumo desde la ficha de lectura. */
export interface IngredientDetailResult {
  action: 'edit';
}

/**
 * Ficha de lectura de un insumo: nombre, para qué se usa, cómo se compra (la
 * referencia) y cuánto cuesta por unidad base. El costo lo formatea el negocio
 * ({@link PreviewIngredientCost}, la vista no calcula). El botón Editar cierra
 * devolviendo `{ action: 'edit' }` para que el hub abra el formulario.
 */
@Component({
  selector: 'app-ingredient-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter, Icon],
  template: `
    <migo-card fill>
      <migo-card-header>
        <migo-icon card-icon name="mat:add" size="lg" color="brand" />
        <migo-card-title>{{ data.name }}</migo-card-title>
        <migo-card-subtitle>{{ usageLabel }}</migo-card-subtitle>
        <button card-actions migo-button variant="ghost" type="button" aria-label="Cerrar" (click)="close()">
          <migo-icon icon-leading name="mat:close" size="sm" />
        </button>
      </migo-card-header>

      <migo-card-body>
        <dl class="flex flex-col gap-3 m-0">
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-caption text-muted">Cómo se compra</dt>
            <dd class="m-0 text-body text-end">{{ reference() || '—' }}</dd>
          </div>
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-caption text-muted">Te cuesta</dt>
            <dd class="m-0 text-body text-end">{{ perBaseUnitLabel() || '—' }}</dd>
          </div>
        </dl>
      </migo-card-body>

      <migo-card-footer>
        <button migo-button variant="ghost" type="button" (click)="close()">Cerrar</button>
        <button migo-button type="button" (click)="edit()">
          <migo-icon icon-leading name="mat:edit" size="sm" />
          Editar
        </button>
      </migo-card-footer>
    </migo-card>
  `,
})
export class IngredientDetail {
  protected readonly ref = inject<MigoDialogRef<IngredientDetailResult>>(MigoDialogRef);
  protected readonly data = inject<IngredientDetailData>(MIGO_DIALOG_DATA);
  private readonly previewCost = inject(PreviewIngredientCost);

  protected readonly usageLabel = USAGE_LABELS[this.data.usage];
  protected readonly reference = signal('');
  protected readonly perBaseUnitLabel = signal('');

  constructor() {
    void this.computeCost();
  }

  protected close(): void {
    this.ref.close();
  }

  protected edit(): void {
    this.ref.close({ action: 'edit' });
  }

  private async computeCost(): Promise<void> {
    const { reference, perBaseUnitLabel } = await this.previewCost.execute({
      purchasePrice: { amount: this.data.purchase.amount, per: this.data.purchase.per },
    });
    this.reference.set(reference);
    this.perBaseUnitLabel.set(perBaseUnitLabel);
  }
}
