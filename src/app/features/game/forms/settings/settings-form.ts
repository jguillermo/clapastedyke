import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { DialogFrame } from '../../../_common/dialog-frame/dialog-frame';
import { UI_FORMS } from '../../../_common/directives/ui';

/**
 * Settings form — Tailwind redesign (tokens + ui directives).
 * Inputs `highlight`/`values` are consumed by the tutorial game; ids intact.
 */
@Component({
  selector: 'app-settings-form',
  imports: [DialogFrame, TranslocoPipe, ...UI_FORMS],
  providers: [provideTranslocoScope('formsCatalog')],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './settings-form.html',
})
export class SettingsForm {
  static readonly id = 'configuracion';
  static readonly gasFile = 'ConfiguracionForm';
  static readonly titleKey = 'formsCatalog.settings.title';

  readonly highlight = input<string[]>([]);
  readonly values = input<Record<string, string>>({});

  protected readonly icon =
    '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>';

  protected readonly marks = computed(() => new Set(this.highlight()));
  protected value(id: string): string {
    return this.values()[id] ?? '';
  }
}
