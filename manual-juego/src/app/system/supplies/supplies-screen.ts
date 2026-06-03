import { Component, inject, signal } from '@angular/core';
import { FormField, disabled, form, maxLength, min, required, submit } from '@angular/forms/signals';
import { TranslocoPipe, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { Business } from '../../composition/business';
import { DomainError } from '../../business/shared/domain/errors';
import { SupplierPrimitives } from '../../business/catalog/domain/supplier/supplier';
import { StockLight, SupplyType } from '../../business/catalog/domain/supply/supply';
import { BaseUnit } from '../../business/shared/domain/quantity';
import { SupplyListItem } from '../../business/catalog/application/list-supplies/list-supplies';
import { UI_FORMS } from '../../forms/ui/ui';

/**
 * Supplies screen: ingredients and packaging, live against IndexedDB. The
 * richest catalog screen (selects, numbers, derived fields). Signal Forms for
 * per-field validation; BUSINESS rules (unique name…) arrive as a notice if
 * the use case rejects. On EDIT, type and base unit are disabled (they define
 * the supply's nature) and the initial stock is hidden (live stock moves
 * through inventory).
 */
@Component({
  selector: 'app-supplies-screen',
  imports: [...UI_FORMS, FormField, TranslocoPipe],
  providers: [provideTranslocoScope('catalog')],
  templateUrl: './supplies-screen.html',
})
export class SuppliesScreen {
  private readonly business = inject(Business);
  private readonly transloco = inject(TranslocoService);

  protected readonly supplies = signal<SupplyListItem[]>([]);
  protected readonly suppliers = signal<SupplierPrimitives[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly notice = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // editingId MUST be declared before the form: the schema reads it in disabled().
  protected readonly editingId = signal<string | null>(null);

  protected readonly model = signal({
    name: '',
    type: 'ingredient' as SupplyType,
    baseUnit: 'g' as BaseUnit,
    presentationSize: 0,
    presentationPriceSoles: 0,
    initialStock: 0,
    minStock: 0,
    recommendedSupplierId: '',
  });

  protected readonly form = form(this.model, field => {
    required(field.name, { message: 'catalog.supplies.nameRequired' });
    maxLength(field.name, 80, { message: 'catalog.supplies.nameMax' });
    min(field.presentationSize, 0.0001, { message: 'catalog.supplies.presentationSizeMin' });
    min(field.presentationPriceSoles, 0.01, { message: 'catalog.supplies.presentationPriceMin' });
    min(field.initialStock, 0, { message: 'catalog.supplies.stockMin' });
    min(field.minStock, 0, { message: 'catalog.supplies.stockMin' });
    // On edit the supply's nature does not change.
    disabled(field.type, () => this.editingId() !== null);
    disabled(field.baseUnit, () => this.editingId() !== null);
  });

  constructor() {
    void this.reload();
    void this.loadSuppliers();
  }

  private async loadSuppliers(): Promise<void> {
    this.suppliers.set(await this.business.listSuppliers.execute());
  }

  protected async reload(): Promise<void> {
    this.loading.set(true);
    this.supplies.set(await this.business.listSupplies.execute({}));
    this.loading.set(false);
  }

  /** Maps the business stock light to the uiDot directive's color. */

  protected edit(supply: SupplyListItem): void {
    this.editingId.set(supply.id);
    this.model.set({
      name: supply.name,
      type: supply.type,
      baseUnit: supply.baseUnit,
      presentationSize: supply.presentationSize,
      presentationPriceSoles: supply.presentationPriceSoles,
      initialStock: 0,
      minStock: supply.minStock,
      recommendedSupplierId: supply.recommendedSupplierId ?? '',
    });
    this.form().reset();
    this.notice.set(null);
  }

  protected clearForm(): void {
    this.editingId.set(null);
    this.model.set({
      name: '',
      type: 'ingredient',
      baseUnit: 'g',
      presentationSize: 0,
      presentationPriceSoles: 0,
      initialStock: 0,
      minStock: 0,
      recommendedSupplierId: '',
    });
    this.form().reset();
    this.notice.set(null);
  }

  /** submit() marks every field as touched and only runs if valid. */
  protected save(): void {
    void submit(this.form, async () => {
      this.saving.set(true);
      this.notice.set(null);
      try {
        const m = this.model();
        const editing = this.editingId() !== null;
        const r = await this.business.saveSupply.execute({
          id: this.editingId() ?? undefined,
          name: m.name,
          type: m.type,
          baseUnit: m.baseUnit,
          presentationSize: m.presentationSize,
          presentationPriceSoles: m.presentationPriceSoles,
          // Live stock moves through inventory: on edit it is NOT sent.
          ...(editing ? {} : { initialStock: m.initialStock }),
          minStock: m.minStock,
          recommendedSupplierId: m.recommendedSupplierId || undefined,
        });
        this.notice.set({
          kind: 'ok',
          text: this.transloco.translate('catalog.supplies.saved', { id: r.id }),
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
