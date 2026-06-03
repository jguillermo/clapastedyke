import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { DialogFrame } from '../dialog-frame/dialog-frame';
// UI directives still come from the legacy formularios path (renamed at cutover).
import { UI_FORMS } from '../../forms/ui/ui';

/**
 * New quote form — Tailwind redesign (tokens + ui directives).
 * The vanilla logic lives in gas/logica/NuevoPresupuestoForm.js and is attached on export.
 * Inputs `highlight`/`values` are consumed by the tutorial game; ids intact.
 * The game id stays 'nuevo-presupuesto' (game content references it).
 */
@Component({
  selector: 'app-new-quote-form',
  imports: [DialogFrame, TranslocoPipe, ...UI_FORMS],
  providers: [provideTranslocoScope('formsSales')],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './new-quote-form.html',
})
export class NewQuoteForm {
  static readonly id = 'nuevo-presupuesto';
  static readonly gasFile = 'NuevoPresupuestoForm';
  static readonly titleKey = 'formsSales.newQuote.title';

  readonly highlight = input<string[]>([]);
  readonly values = input<Record<string, string>>({});

  protected readonly icon =
    '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>';

  protected readonly marks = computed(() => new Set(this.highlight()));
  protected value(id: string): string {
    return this.values()[id] ?? '';
  }
}
