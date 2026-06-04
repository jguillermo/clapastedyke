import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { DialogFrame } from '../../../_common/dialog-frame/dialog-frame';
// UI directives still come from the legacy formularios path (renamed at cutover).
import { UI_FORMS } from '../../../_common/ui/ui';

/**
 * Quote detail form — Tailwind redesign (chrome only: uiEmpty + uiButton).
 * The vanilla logic lives in gas/logica/DetallePresupuestoForm.js and is attached on export.
 * Keeps idTitulo='titulo'/idPie='pie' semantics via DialogFrame titleId/footerId.
 * Inputs `highlight`/`values` are consumed by the tutorial game; ids intact.
 * The game id stays 'detalle-presupuesto' (game content references it).
 */
@Component({
  selector: 'app-quote-detail-form',
  imports: [DialogFrame, TranslocoPipe, ...UI_FORMS],
  providers: [provideTranslocoScope('formsSales')],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './quote-detail-form.html',
})
export class QuoteDetailForm {
  static readonly id = 'detalle-presupuesto';
  static readonly gasFile = 'DetallePresupuestoForm';
  static readonly titleKey = 'formsSales.quoteDetail.title';

  readonly highlight = input<string[]>([]);
  readonly values = input<Record<string, string>>({});

  protected readonly icon =
    '<path d="M5 3h9l4 4v8"/><path d="M5 3v18h7"/><path d="M9 9h5M9 13h3"/><circle cx="16" cy="17" r="3"/><path d="M18.2 19.2L21 22"/>';

  protected readonly marks = computed(() => new Set(this.highlight()));
  protected value(id: string): string {
    return this.values()[id] ?? '';
  }
}
