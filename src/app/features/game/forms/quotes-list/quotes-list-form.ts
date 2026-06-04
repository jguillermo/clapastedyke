import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { DialogFrame } from '../../../_common/dialog-frame/dialog-frame';
// UI directives still come from the legacy formularios path (renamed at cutover).
import { UI_FORMS } from '../../../_common/directives/ui';

/**
 * Quotes list form — Tailwind redesign (tokens + ui directives).
 * The vanilla logic lives in gas/logica/VerPresupuestosForm.js and is attached on export.
 * Inputs `highlight`/`values` are consumed by the tutorial game; ids intact.
 * The game id stays 'ver-presupuestos' (game content references it).
 */
@Component({
  selector: 'app-quotes-list-form',
  imports: [DialogFrame, TranslocoPipe, ...UI_FORMS],
  providers: [provideTranslocoScope('formsSales')],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './quotes-list-form.html',
})
export class QuotesListForm {
  static readonly id = 'ver-presupuestos';
  static readonly gasFile = 'VerPresupuestosForm';
  static readonly titleKey = 'formsSales.quotesList.title';

  readonly highlight = input<string[]>([]);
  readonly values = input<Record<string, string>>({});

  protected readonly icon =
    '<path d="M8 3h7l3 3v11H8z"/><path d="M5 7v13a1 1 0 0 0 1 1h9"/><path d="M11 9h4M11 13h4"/>';

  protected readonly marks = computed(() => new Set(this.highlight()));
  protected value(id: string): string {
    return this.values()[id] ?? '';
  }
}
