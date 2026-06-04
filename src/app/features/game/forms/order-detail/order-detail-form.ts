import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { DialogFrame } from '../../../_common/dialog-frame/dialog-frame';
// UI directives still come from the legacy formularios path (renamed at cutover).
import { UI_FORMS } from '../../../_common/ui/ui';

/**
 * Order detail form — Tailwind redesign (chrome only: uiEmpty + uiButton).
 * The vanilla logic lives in gas/logica/DetallePedidoForm.js and is attached on export.
 * Keeps the chrome ids (titleId='titulo'/footerId='pie') via DialogFrame inputs.
 * Inputs `highlight`/`values` are consumed by the tutorial game; ids intact.
 * The game id stays 'detalle-pedido' (game content references it).
 */
@Component({
  selector: 'app-order-detail-form',
  imports: [DialogFrame, TranslocoPipe, ...UI_FORMS],
  providers: [provideTranslocoScope('formsSales')],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './order-detail-form.html',
})
export class OrderDetailForm {
  static readonly id = 'detalle-pedido';
  static readonly gasFile = 'DetallePedidoForm';
  static readonly titleKey = 'formsSales.orderDetail.title';

  readonly highlight = input<string[]>([]);
  readonly values = input<Record<string, string>>({});

  protected readonly icon =
    '<path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/>';

  protected readonly marks = computed(() => new Set(this.highlight()));
  protected value(id: string): string {
    return this.values()[id] ?? '';
  }
}
