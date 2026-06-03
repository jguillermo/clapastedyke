import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { DialogFrame } from '../dialog-frame/dialog-frame';
import { UI_FORMS } from '../../forms/ui/ui';

/**
 * Adjust inventory form — Tailwind redesign (tokens + ui directives).
 * Inputs `highlight`/`values` are consumed by the tutorial game; ids intact.
 */
@Component({
  selector: 'app-adjust-inventory-form',
  imports: [DialogFrame, TranslocoPipe, ...UI_FORMS],
  providers: [provideTranslocoScope('formsCatalog')],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './adjust-inventory-form.html',
})
export class AdjustInventoryForm {
  static readonly id = 'ajustar-inventario';
  static readonly gasFile = 'AjustarInventarioForm';
  static readonly titleKey = 'formsCatalog.adjustInventory.title';

  readonly highlight = input<string[]>([]);
  readonly values = input<Record<string, string>>({});

  protected readonly icon =
    '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2.2"/><circle cx="15" cy="12" r="2.2"/><circle cx="8" cy="17" r="2.2"/>';

  protected readonly marks = computed(() => new Set(this.highlight()));
  protected value(id: string): string {
    return this.values()[id] ?? '';
  }
}
