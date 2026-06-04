import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { DialogFrame } from '../../../_common/dialog-frame/dialog-frame';
// UI directives still come from the legacy formularios path (renamed at cutover).
import { UI_FORMS } from '../../../_common/directives/ui';

/**
 * Orders list form — Tailwind redesign (tokens + ui directives).
 * The vanilla logic lives in gas/logica/VerPedidosForm.js and is attached on export.
 * Inputs `highlight`/`values` are consumed by the tutorial game; ids intact.
 * The game id stays 'ver-pedidos' (game content references it).
 */
@Component({
  selector: 'app-orders-list-form',
  imports: [DialogFrame, TranslocoPipe, ...UI_FORMS],
  providers: [provideTranslocoScope('formsSales')],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './orders-list-form.html',
})
export class OrdersListForm {
  static readonly id = 'ver-pedidos';
  static readonly gasFile = 'VerPedidosForm';
  static readonly titleKey = 'formsSales.ordersList.title';

  readonly highlight = input<string[]>([]);
  readonly values = input<Record<string, string>>({});

  protected readonly icon =
    '<path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/><path d="M9 12h6"/>';

  protected readonly marks = computed(() => new Set(this.highlight()));
  protected value(id: string): string {
    return this.values()[id] ?? '';
  }
}
