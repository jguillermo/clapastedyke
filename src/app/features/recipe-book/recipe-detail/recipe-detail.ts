import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { PreviewRecipeCost } from '@core/recipe-book/application/use-cases/preview-recipe-cost.use-case';

/** Una línea de la receta lista para pintar; lleva los datos para calcular su costo. */
export interface RecipeDetailLine {
  name: string;
  quantityLabel: string;
  purchasePrice: { amount: number; per: { value: number; unit: BaseUnit } } | null;
  quantity: { value: number; unit: BaseUnit };
}

/** Datos del diálogo de lectura de una receta. */
export interface RecipeDetailData {
  /** Subtítulo de la ficha (el nombre de la categoría). */
  subtitle: string;
  name: string;
  chips: string[];
  lines: RecipeDetailLine[];
}

/** El usuario pidió editar esta receta desde la ficha de lectura. */
export interface RecipeDetailResult {
  action: 'edit';
}

interface LineView {
  name: string;
  quantityLabel: string;
  cost: string;
}

/**
 * Ficha de lectura ("página de recetario") de un queque, relleno o cobertura:
 * cabecera con nombre + características, tabla de ingredientes con cantidad y
 * costo, y el total de materiales. Solo lectura; el costo lo calcula el negocio
 * ({@link PreviewRecipeCost}, la vista no calcula). El botón Editar cierra el
 * diálogo devolviendo `{ action: 'edit' }` para que el hub abra el formulario.
 */
@Component({
  selector: 'app-recipe-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter, Icon],
  // `contents`: el card `fill` es hijo flex directo del diálogo y llena la pantalla en móvil.
  host: { class: 'contents' },
  template: `
    <migo-card fill>
      <migo-card-header>
        <migo-icon card-icon name="mat:layers" size="lg" color="brand" />
        <migo-card-title>{{ data.name }}</migo-card-title>
        <migo-card-subtitle>{{ subtitle }}</migo-card-subtitle>
        <button card-actions migo-button variant="ghost" type="button" aria-label="Cerrar" (click)="close()">
          <migo-icon icon-leading name="mat:close" size="sm" />
        </button>
      </migo-card-header>

      <migo-card-body>
        @if (data.chips.length) {
          <div class="flex flex-wrap items-center gap-1.5 mb-4">
            @for (chip of data.chips; track chip) {
              <span class="inline-flex items-center min-h-6 px-2.5 rounded-full bg-surface-card border border-border-subtle text-caption text-body">
                {{ chip }}
              </span>
            }
          </div>
        }

        <div class="overflow-x-auto">
          <table class="w-full min-w-max border-collapse">
            <thead>
              <tr class="text-start text-caption text-muted">
                <th class="py-2 pe-3 text-start font-medium">Ingrediente</th>
                <th class="py-2 px-3 text-end font-medium">Cantidad</th>
                <th class="py-2 ps-3 text-end font-medium">Costo</th>
              </tr>
            </thead>
            <tbody>
              @for (line of lines(); track $index) {
                <tr class="border-t border-border-subtle">
                  <td class="py-2 pe-3 text-body">{{ line.name }}</td>
                  <td class="py-2 px-3 text-end text-body tabular-nums">{{ line.quantityLabel }}</td>
                  <td class="py-2 ps-3 text-end text-body tabular-nums">{{ line.cost || '—' }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="border-t border-border-strong">
                <td class="py-2 pe-3 font-semibold text-heading" colspan="2">Total materiales</td>
                <td class="py-2 ps-3 text-end font-semibold text-heading tabular-nums">{{ total() || '—' }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
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
export class RecipeDetail {
  protected readonly ref = inject<MigoDialogRef<RecipeDetailResult>>(MigoDialogRef);
  protected readonly data = inject<RecipeDetailData>(MIGO_DIALOG_DATA);
  private readonly previewCost = inject(PreviewRecipeCost);

  protected readonly subtitle = this.data.subtitle;
  protected readonly total = signal('');
  private readonly costs = signal<string[]>([]);

  protected readonly lines = computed<LineView[]>(() =>
    this.data.lines.map((line, i) => ({
      name: line.name,
      quantityLabel: line.quantityLabel,
      cost: this.costs()[i] ?? '',
    })),
  );

  constructor() {
    void this.computeCosts();
  }

  protected close(): void {
    this.ref.close();
  }

  protected edit(): void {
    this.ref.close({ action: 'edit' });
  }

  private async computeCosts(): Promise<void> {
    const result = await this.previewCost.execute({
      lines: this.data.lines.map((line) => ({ purchasePrice: line.purchasePrice, quantity: line.quantity })),
    });
    this.costs.set(result.items.map((item) => item.cost));
    this.total.set(result.total);
  }
}
