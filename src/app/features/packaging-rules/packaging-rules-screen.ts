import { Component, computed, inject, signal } from '@angular/core';
import { FormField, disabled, form, min, required, submit } from '@angular/forms/signals';
import { TranslocoPipe, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { SavePackagingRule } from '../../core/catalog/application/save-packaging-rule/save-packaging-rule';
import { ListPackagingRules } from '../../core/catalog/application/list-packaging-rules/list-packaging-rules';
import { ListRecipes } from '../../core/catalog/application/list-recipes/list-recipes';
import { ListSupplies } from '../../core/catalog/application/list-supplies/list-supplies';
import { GetSettings } from '../../core/settings/application/get-settings/get-settings';
import { DomainError } from '../../core/_common/domain/errors';
import { PackagingRulePrimitives } from '../../core/catalog/domain/packaging-rule/packaging-rule';
import { RecipePrimitives } from '../../core/catalog/domain/recipe/recipe';
import { SupplyListItem } from '../../core/catalog/application/list-supplies/list-supplies';
import { BusinessSize } from '../../core/settings/domain/business-settings';
import { UI_FORMS } from '../_common/directives/ui';

/**
 * Packaging rules, live against IndexedDB. Signal Forms for per-field
 * validation; the uniqueness of the (recipe, size, packaging) triple and the
 * rest of the business rules live in the domain and arrive as a notice if the
 * use case rejects. On EDIT only packaging and quantity may change: recipe and
 * size are disabled through the form schema.
 */
@Component({
  selector: 'app-packaging-rules-screen',
  imports: [...UI_FORMS, FormField, TranslocoPipe],
  providers: [provideTranslocoScope('catalog')],
  templateUrl: './packaging-rules-screen.html',
})
export class PackagingRulesScreen {
  private readonly savePackagingRule = inject(SavePackagingRule);
  private readonly listPackagingRules = inject(ListPackagingRules);
  private readonly listRecipes = inject(ListRecipes);
  private readonly listSupplies = inject(ListSupplies);
  private readonly getSettings = inject(GetSettings);
  private readonly transloco = inject(TranslocoService);

  protected readonly rules = signal<PackagingRulePrimitives[]>([]);
  protected readonly recipes = signal<RecipePrimitives[]>([]);
  protected readonly sizes = signal<BusinessSize[]>([]);
  protected readonly packagings = signal<SupplyListItem[]>([]);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly notice = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);
  protected readonly editingId = signal<string | null>(null);

  // id→name maps to resolve names in the table.
  protected readonly recipeName = computed(() => {
    const m = new Map<string, string>();
    for (const r of this.recipes()) m.set(r.id, r.name);
    return m;
  });
  protected readonly packagingName = computed(() => {
    const m = new Map<string, string>();
    for (const p of this.packagings()) m.set(p.id, p.name);
    return m;
  });

  // Model + per-field validation form.
  protected readonly model = signal({
    recipeId: '',
    size: '',
    packagingSupplyId: '',
    quantity: 0,
  });
  protected readonly form = form(this.model, field => {
    required(field.recipeId, { message: 'catalog.packagingRules.recipeRequired' });
    required(field.size, { message: 'catalog.packagingRules.sizeRequired' });
    required(field.packagingSupplyId, { message: 'catalog.packagingRules.packagingRequired' });
    min(field.quantity, 0.0001, { message: 'catalog.packagingRules.quantityMin' });
    // On edit the domain only allows changing packaging/quantity.
    disabled(field.recipeId, () => this.editingId() !== null);
    disabled(field.size, () => this.editingId() !== null);
  });

  constructor() {
    void this.loadCatalogs();
    void this.reload();
  }

  private async loadCatalogs(): Promise<void> {
    this.recipes.set(await this.listRecipes.execute());
    this.packagings.set(await this.listSupplies.execute({ type: 'packaging' }));
    const settings = await this.getSettings.execute();
    this.sizes.set([...settings.sizes]);
  }

  protected async reload(): Promise<void> {
    this.loading.set(true);
    this.rules.set(await this.listPackagingRules.execute());
    this.loading.set(false);
  }

  protected sizeLabel(s: BusinessSize): string {
    return this.transloco.translate('catalog.packagingRules.sizeWithFactor', {
      name: s.name,
      factor: s.factor,
    });
  }

  protected edit(rule: PackagingRulePrimitives): void {
    this.editingId.set(rule.id);
    this.model.set({
      recipeId: rule.recipeId,
      size: rule.size,
      packagingSupplyId: rule.packagingSupplyId,
      quantity: rule.quantity,
    });
    this.form().reset();
    this.notice.set(null);
  }

  protected clearForm(): void {
    this.editingId.set(null);
    this.model.set({ recipeId: '', size: '', packagingSupplyId: '', quantity: 0 });
    this.form().reset();
    this.notice.set(null);
  }

  /** submit() marks every field as touched and only runs if valid. */
  protected save(): void {
    void submit(this.form, async () => {
      this.saving.set(true);
      this.notice.set(null);
      try {
        const r = await this.savePackagingRule.execute({
          id: this.editingId() ?? undefined,
          ...this.model(),
        });
        this.notice.set({
          kind: 'ok',
          text: this.transloco.translate('catalog.packagingRules.saved', { id: r.id }),
        });
        this.clearForm();
        await this.reload();
      } catch (error) {
        const text =
          error instanceof DomainError
            ? error.message
            : this.transloco.translate('common.couldNotSave');
        this.notice.set({ kind: 'err', text });
      } finally {
        this.saving.set(false);
      }
    });
  }
}
