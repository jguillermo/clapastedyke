import { Component, inject, signal } from '@angular/core';
import { FormField, applyEach, form, max, min, required, submit } from '@angular/forms/signals';
import { TranslocoPipe, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { SettingsService } from '../../core/settings/settings.service';
import { DomainError } from '../../core/_common/domain/errors';
import {
  Language,
  Rounding,
  StockDeductionMoment,
} from '../../core/settings/domain/business-settings';
import { UI_FORMS } from '../_common/directives/ui';

interface SettingsModel {
  laborRatePerHour: number;
  indirectCostPerOrder: number;
  depreciationPerOrder: number;
  defaultMargin: number;
  applyIgv: boolean;
  igvRate: number;
  rounding: Rounding;
  quoteExpiryDays: number;
  stockDeductionMoment: StockDeductionMoment;
  businessName: string;
  language: Language;
  sizes: { name: string; factor: number }[];
}

/**
 * SETTINGS SCREEN (Flow 13): the parameters used to build the price and the
 * list of sellable sizes. Dynamic size rows with applyEach (same pattern as
 * recipe ingredients). PER-FIELD validation in Signal Forms; hard BUSINESS
 * rules (margin [0,100), etc.) are enforced by the domain and arrive as a
 * notice. Saved quotes are frozen: these changes only affect new ones.
 *
 * The «Operation» section adds an interface-language selector: saving with a
 * changed language switches the UI live — the composition root listens to the
 * 'SettingsUpdated' event and follows the persisted setting, so the screen only
 * needs to include `language` in the payload.
 */
@Component({
  selector: 'app-settings-screen',
  imports: [...UI_FORMS, FormField, TranslocoPipe],
  templateUrl: './settings-screen.html',
  providers: [provideTranslocoScope('operations')],
})
export class SettingsScreen {
  private readonly settings = inject(SettingsService);
  private readonly transloco = inject(TranslocoService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly notice = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);

  protected readonly model = signal<SettingsModel>({
    laborRatePerHour: 0,
    indirectCostPerOrder: 0,
    depreciationPerOrder: 0,
    defaultMargin: 0,
    applyIgv: false,
    igvRate: 0,
    rounding: 'MULTIPLE_OF_5',
    quoteExpiryDays: 0,
    stockDeductionMoment: 'ON_APPROVAL',
    businessName: '',
    language: 'es',
    sizes: [],
  });

  protected readonly form = form(this.model, field => {
    min(field.laborRatePerHour, 0, { message: 'operations.settings.notNegative' });
    min(field.indirectCostPerOrder, 0, { message: 'operations.settings.notNegative' });
    min(field.depreciationPerOrder, 0, { message: 'operations.settings.notNegative' });
    min(field.defaultMargin, 0, { message: 'operations.settings.notNegative' });
    max(field.defaultMargin, 99, { message: 'operations.settings.max99' });
    min(field.igvRate, 0, { message: 'operations.settings.notNegative' });
    max(field.igvRate, 99, { message: 'operations.settings.max99' });
    min(field.quoteExpiryDays, 1, { message: 'operations.settings.minDays' });
    required(field.businessName, { message: 'operations.settings.businessNameRequired' });
    applyEach(field.sizes, s => {
      required(s.name, { message: 'operations.settings.sizeNameRequired' });
      min(s.factor, 0.0001, { message: 'operations.settings.sizeFactorPositive' });
    });
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const settings = await this.settings.getSettings.execute();
    const g = settings.general;
    this.model.set({
      laborRatePerHour: g.laborRatePerHour,
      indirectCostPerOrder: g.indirectCostPerOrder,
      depreciationPerOrder: g.depreciationPerOrder,
      defaultMargin: g.defaultMargin,
      applyIgv: g.applyIgv,
      igvRate: g.igvRate,
      rounding: g.rounding,
      quoteExpiryDays: g.quoteExpiryDays,
      stockDeductionMoment: g.stockDeductionMoment,
      businessName: g.businessName,
      language: g.language,
      sizes: settings.sizes.map(s => ({ name: s.name, factor: s.factor })),
    });
    this.form().reset();
    this.loading.set(false);
  }

  protected addSize(): void {
    this.model.update(m => ({ ...m, sizes: [...m.sizes, { name: '', factor: 1 }] }));
  }

  protected removeSize(index: number): void {
    this.model.update(m => ({ ...m, sizes: m.sizes.filter((_, i) => i !== index) }));
  }

  /** submit() marks all fields touched and only runs if valid. */
  protected save(): void {
    void submit(this.form, async () => {
      this.saving.set(true);
      this.notice.set(null);
      try {
        const m = this.model();
        await this.settings.updateSettings.execute({
          general: {
            laborRatePerHour: m.laborRatePerHour,
            indirectCostPerOrder: m.indirectCostPerOrder,
            depreciationPerOrder: m.depreciationPerOrder,
            defaultMargin: m.defaultMargin,
            applyIgv: m.applyIgv,
            igvRate: m.igvRate,
            rounding: m.rounding,
            quoteExpiryDays: m.quoteExpiryDays,
            stockDeductionMoment: m.stockDeductionMoment,
            businessName: m.businessName,
            language: m.language,
          },
          sizes: m.sizes,
        });
        // The language change is propagated live by the composition root
        // (subscribed to 'SettingsUpdated'). The notice stores a KEY resolved
        // by the transloco pipe in the template, so it renders in the NEW
        // language once its file loads (an imperative translate() here would
        // race that load and show the raw key).
        this.notice.set({ kind: 'ok', text: 'operations.settings.savedNotice' });
        await this.load();
      } catch (error) {
        const text =
          error instanceof DomainError
            ? error.message
            : this.transloco.translate('operations.settings.couldNotSave');
        this.notice.set({ kind: 'err', text });
      } finally {
        this.saving.set(false);
      }
    });
  }
}
