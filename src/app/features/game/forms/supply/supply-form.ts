import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { DialogFrame } from '../../../_common/dialog-frame/dialog-frame';
import { UI_FORMS } from '../../../_common/directives/ui';

/**
 * Supply form — Tailwind redesign (tokens + ui directives).
 * Inputs `highlight`/`values` are consumed by the tutorial game; ids intact.
 */
@Component({
  selector: 'app-supply-form',
  imports: [DialogFrame, TranslocoPipe, ...UI_FORMS],
  providers: [provideTranslocoScope('formsCatalog')],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './supply-form.html',
})
export class SupplyForm {
  static readonly id = 'insumos';
  static readonly gasFile = 'InsumosForm';
  static readonly titleKey = 'formsCatalog.supply.title';

  readonly highlight = input<string[]>([]);
  readonly values = input<Record<string, string>>({});

  protected readonly icon =
    '<path d="M12 3l8 4v10l-8 4-8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10"/>';

  protected readonly marks = computed(() => new Set(this.highlight()));
  protected value(id: string): string {
    return this.values()[id] ?? '';
  }
}
