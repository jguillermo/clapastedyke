import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { DialogFrame } from '../dialog-frame/dialog-frame';
import { UI_FORMS } from '../../forms/ui/ui';

/**
 * Packaging rule form — Tailwind redesign (tokens + ui directives).
 * Inputs `highlight`/`values` are consumed by the tutorial game; ids intact.
 */
@Component({
  selector: 'app-packaging-rule-form',
  imports: [DialogFrame, TranslocoPipe, ...UI_FORMS],
  providers: [provideTranslocoScope('formsCatalog')],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './packaging-rule-form.html',
})
export class PackagingRuleForm {
  static readonly id = 'reglas-empaque';
  static readonly gasFile = 'ReglasEmpaqueForm';
  static readonly titleKey = 'formsCatalog.packagingRule.title';

  readonly highlight = input<string[]>([]);
  readonly values = input<Record<string, string>>({});

  protected readonly icon =
    '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/>';

  protected readonly marks = computed(() => new Set(this.highlight()));
  protected value(id: string): string {
    return this.values()[id] ?? '';
  }
}
