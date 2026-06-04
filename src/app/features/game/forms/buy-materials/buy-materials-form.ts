import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { DialogFrame } from '../../../_common/dialog-frame/dialog-frame';
// UI directives still come from the legacy formularios path (renamed at cutover).
import { UI_FORMS } from '../../../_common/ui/ui';

/**
 * Buy materials form — Tailwind redesign (tokens + ui directives).
 * The vanilla logic lives in gas/logica/ComprarMaterialesForm.js and is attached on export.
 * Inputs `highlight`/`values` are consumed by the tutorial game; ids intact.
 * The game id stays 'comprar-materiales' (game content references it).
 */
@Component({
  selector: 'app-buy-materials-form',
  imports: [DialogFrame, TranslocoPipe, ...UI_FORMS],
  providers: [provideTranslocoScope('formsSales')],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './buy-materials-form.html',
})
export class BuyMaterialsForm {
  static readonly id = 'comprar-materiales';
  static readonly gasFile = 'ComprarMaterialesForm';
  static readonly titleKey = 'formsSales.buyMaterials.title';

  readonly highlight = input<string[]>([]);
  readonly values = input<Record<string, string>>({});

  protected readonly icon =
    '<path d="M3 4h2l2.2 11h10l1.8-8H6"/><circle cx="9" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/>';

  protected readonly marks = computed(() => new Set(this.highlight()));
  protected value(id: string): string {
    return this.values()[id] ?? '';
  }
}
