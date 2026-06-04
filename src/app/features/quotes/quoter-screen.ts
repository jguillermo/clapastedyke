import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, max, min, required, submit, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { ListCustomers } from '../../core/catalog/application/list-customers/list-customers';
import { ListRecipes } from '../../core/catalog/application/list-recipes/list-recipes';
import { ListSupplies } from '../../core/catalog/application/list-supplies/list-supplies';
import { ListPackagingRules } from '../../core/catalog/application/list-packaging-rules/list-packaging-rules';
import { GetSettings } from '../../core/settings/application/get-settings/get-settings';
import { CalculateQuote } from '../../core/sales/application/calculate-quote/calculate-quote';
import { SaveQuote } from '../../core/sales/application/save-quote/save-quote';
import { DomainError } from '../../core/_common/domain/errors';
import { CustomerPrimitives } from '../../core/catalog/domain/customer/customer';
import { RecipePrimitives } from '../../core/catalog/domain/recipe/recipe';
import { SupplyListItem } from '../../core/catalog/application/list-supplies/list-supplies';
import { PackagingRulePrimitives } from '../../core/catalog/domain/packaging-rule/packaging-rule';
import { BusinessSize, ScalingFactor } from '../../core/settings/domain/business-settings';
import { ScalingMode } from '../../core/sales/domain/quote/quote-calculator';
import { QuoteCalculationDto } from '../../core/sales/application/calculate-quote/calculate-quote';
import { UI_FORMS } from '../_common/directives/ui';

interface QuoterModel {
  customerId: string;
  recipeId: string;
  scalingMode: ScalingMode;
  scalingValue: number;
  size: string;
  margin: number;
  applyIgv: boolean;
  notes: string;
}

interface PackagingRow {
  supplyId: string;
  quantity: number;
}

/**
 * QUOTER: the flagship form. Signal Forms validates the model fields one by
 * one; the packaging lives in a separate signal (dynamic rows with simple
 * controlled inputs) because it does NOT scale and because we preload it from
 * the packaging rules. The live preview calls `calculateQuote` (it does not
 * persist) and paints the `QuoteCalculationDto` as-is: the view neither
 * computes nor formats, it only uses the DTO's *Formatted fields.
 *
 * Validation messages are translation KEYS resolved in the template with the
 * transloco pipe (`{{ e.message | transloco }}`).
 */
@Component({
  selector: 'app-quoter-screen',
  imports: [...UI_FORMS, FormField, TranslocoPipe],
  templateUrl: './quoter-screen.html',
  providers: [provideTranslocoScope('sales')],
})
export class QuoterScreen {
  private readonly listCustomers = inject(ListCustomers);
  private readonly listRecipes = inject(ListRecipes);
  private readonly listSupplies = inject(ListSupplies);
  private readonly listPackagingRules = inject(ListPackagingRules);
  private readonly getSettings = inject(GetSettings);
  private readonly calculateQuote = inject(CalculateQuote);
  private readonly saveQuote = inject(SaveQuote);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  protected readonly customers = signal<CustomerPrimitives[]>([]);
  protected readonly recipes = signal<RecipePrimitives[]>([]);
  protected readonly packagingCatalog = signal<SupplyListItem[]>([]);
  protected readonly sizes = signal<BusinessSize[]>([]);
  protected readonly factors = signal<ScalingFactor[]>([]);
  private rules: PackagingRulePrimitives[] = [];

  protected readonly packagingRows = signal<PackagingRow[]>([]);
  protected readonly calc = signal<QuoteCalculationDto | null>(null);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly notice = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);

  protected readonly model = signal<QuoterModel>({
    customerId: '',
    recipeId: '',
    scalingMode: 'people',
    scalingValue: 0,
    size: '',
    margin: 0,
    applyIgv: false,
    notes: '',
  });

  protected readonly quoterForm = form(this.model, field => {
    required(field.customerId, { message: 'sales.quoter.validation.customerRequired' });
    required(field.recipeId, { message: 'sales.quoter.validation.recipeRequired' });
    // size required only in 'size' mode.
    required(field.size, {
      when: ({ valueOf }) => valueOf(field.scalingMode) === 'size',
      message: 'sales.quoter.validation.sizeRequired',
    });
    // scalingValue > 0 when the mode is NOT size (in size mode it is ignored).
    validate(field.scalingValue, ({ value, valueOf }) => {
      if (valueOf(field.scalingMode) === 'size') return undefined;
      return value() > 0
        ? undefined
        : { kind: 'min', message: 'sales.quoter.validation.scalingValueMin' };
    });
    min(field.margin, 0, { message: 'sales.quoter.validation.marginMin' });
    max(field.margin, 99, { message: 'sales.quoter.validation.marginMax' });
  });

  protected readonly isSizeMode = computed(() => this.model().scalingMode === 'size');
  protected readonly isFactorMode = computed(() => this.model().scalingMode === 'factor');

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const [customers, recipes, packaging, settings] = await Promise.all([
      this.listCustomers.execute(),
      this.listRecipes.execute(),
      this.listSupplies.execute({ type: 'packaging' }),
      this.getSettings.execute(),
    ]);
    this.rules = await this.listPackagingRules.execute();
    this.customers.set(customers);
    this.recipes.set(recipes);
    this.packagingCatalog.set(packaging);
    this.sizes.set([...settings.sizes]);
    this.factors.set([...settings.factors]);
    // Prefill margin and IGV from the business settings.
    this.model.update(m => ({
      ...m,
      margin: settings.general.defaultMargin,
      applyIgv: settings.general.applyIgv,
    }));
    this.loading.set(false);
  }

  protected sizeLabel(s: BusinessSize): string {
    return `${s.name} (×${s.factor})`;
  }

  /* ---------- Packaging (dynamic rows, separate signal) ---------- */

  protected addPackaging(): void {
    this.packagingRows.update(rows => [...rows, { supplyId: '', quantity: 0 }]);
  }

  protected removePackaging(index: number): void {
    this.packagingRows.update(rows => rows.filter((_, i) => i !== index));
    void this.recalculate();
  }

  protected changePackagingSupply(index: number, supplyId: string): void {
    this.packagingRows.update(rows => rows.map((r, i) => (i === index ? { ...r, supplyId } : r)));
    void this.recalculate();
  }

  protected changePackagingQuantity(index: number, value: string): void {
    const quantity = Number(value) || 0;
    this.packagingRows.update(rows => rows.map((r, i) => (i === index ? { ...r, quantity } : r)));
    void this.recalculate();
  }

  /** The factor arrives as a string from the select; it goes to the model as a number. */
  protected changeFactor(value: string): void {
    const scalingValue = Number(value) || 0;
    this.model.update(m => ({ ...m, scalingValue }));
    void this.recalculate();
  }

  /** Recipe or size changed: preload suggested packaging from the rules. */
  protected applySuggestedPackaging(): void {
    const { recipeId, size, scalingMode } = this.model();
    if (!recipeId || scalingMode !== 'size' || !size) {
      void this.recalculate();
      return;
    }
    const suggested = this.rules
      .filter(r => r.recipeId === recipeId && r.size === size)
      .map(r => ({ supplyId: r.packagingSupplyId, quantity: r.quantity }));
    this.packagingRows.set(suggested);
    void this.recalculate();
  }

  /* ---------- Live preview ---------- */

  /** Recalculates against the business; if it throws (incomplete data), it clears. */
  protected async recalculate(): Promise<void> {
    const m = this.model();
    if (!m.customerId || !m.recipeId) {
      this.calc.set(null);
      return;
    }
    try {
      const r = await this.calculateQuote.execute({
        recipeId: m.recipeId,
        scalingMode: m.scalingMode,
        scalingValue: m.scalingValue,
        size: m.size,
        packaging: this.packagingRows().filter(p => p.supplyId && p.quantity > 0),
        margin: m.margin,
        applyIgv: m.applyIgv,
      });
      this.calc.set(r);
    } catch {
      this.calc.set(null);
    }
  }

  protected back(): void {
    void this.router.navigateByUrl('/system/quotes');
  }

  protected save(): void {
    void submit(this.quoterForm, async () => {
      this.saving.set(true);
      this.notice.set(null);
      try {
        const m = this.model();
        const r = await this.saveQuote.execute({
          customerId: m.customerId,
          recipeId: m.recipeId,
          scalingMode: m.scalingMode,
          scalingValue: m.scalingValue,
          size: m.size,
          packaging: this.packagingRows().filter(p => p.supplyId && p.quantity > 0),
          margin: m.margin,
          applyIgv: m.applyIgv,
          notes: m.notes,
        });
        const price = this.calc()?.finalPriceFormatted ?? '';
        this.notice.set({
          kind: 'ok',
          text: this.transloco.translate('sales.quoter.saved', { id: r.id, price }),
        });
        void this.router.navigateByUrl('/system/quotes');
      } catch (error) {
        const text =
          error instanceof DomainError ? error.message : this.transloco.translate('common.couldNotSave');
        this.notice.set({ kind: 'err', text });
      } finally {
        this.saving.set(false);
      }
    });
  }
}
