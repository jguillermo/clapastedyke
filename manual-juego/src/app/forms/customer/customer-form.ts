import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { DialogFrame } from '../dialog-frame/dialog-frame';
// UI directives still come from the legacy formularios path (renamed at cutover).
import { UI_FORMS } from '../../forms/ui/ui';

/**
 * Customer form — Tailwind redesign (tokens + ui directives).
 * Inputs `highlight`/`values` are consumed by the tutorial game; ids intact.
 * The game id stays 'clientes' (game content references it).
 */
@Component({
  selector: 'app-customer-form',
  imports: [DialogFrame, TranslocoPipe, ...UI_FORMS],
  providers: [provideTranslocoScope('formsCatalog')],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './customer-form.html',
})
export class CustomerForm {
  static readonly id = 'clientes';
  static readonly gasFile = 'ClientesForm';
  static readonly titleKey = 'formsCatalog.customer.title';

  readonly highlight = input<string[]>([]);
  readonly values = input<Record<string, string>>({});

  protected readonly icon =
    '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6"/>';

  protected readonly marks = computed(() => new Set(this.highlight()));
  protected value(id: string): string {
    return this.values()[id] ?? '';
  }
}
