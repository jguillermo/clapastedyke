import { Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength, pattern, required, submit } from '@angular/forms/signals';
import { TranslocoPipe, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { CatalogService } from '../../core/catalog/catalog.service';
import { DomainError } from '../../core/_common/domain/errors';
import { SupplierPrimitives } from '../../core/catalog/domain/supplier/supplier';
import { UI_FORMS } from '../_common/directives/ui';

/**
 * Suppliers screen, live against IndexedDB. Same canonical pattern as
 * Customers: Signal Forms for per-field validation; BUSINESS rules (unique
 * name…) stay in the domain and arrive as a notice if the use case rejects.
 */
@Component({
  selector: 'app-suppliers-screen',
  imports: [...UI_FORMS, FormField, TranslocoPipe],
  providers: [provideTranslocoScope('catalog')],
  templateUrl: './suppliers-screen.html',
})
export class SuppliersScreen {
  private readonly catalog = inject(CatalogService);
  private readonly transloco = inject(TranslocoService);

  protected readonly suppliers = signal<SupplierPrimitives[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly notice = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);
  protected readonly editingId = signal<string | null>(null);

  // Model + per-field validation form
  protected readonly model = signal({ name: '', whatsapp: '', notes: '' });
  protected readonly form = form(this.model, field => {
    required(field.name, { message: 'catalog.suppliers.nameRequired' });
    maxLength(field.name, 80, { message: 'catalog.suppliers.nameMax' });
    required(field.whatsapp, { message: 'catalog.suppliers.whatsappRequired' });
    pattern(field.whatsapp, /^[+\d][\d\s()-]{7,}$/, {
      message: 'catalog.suppliers.whatsappPattern',
    });
    maxLength(field.whatsapp, 20, { message: 'catalog.suppliers.whatsappMax' });
    maxLength(field.notes, 200, { message: 'catalog.suppliers.notesMax' });
  });

  constructor() {
    void this.reload();
  }

  protected async reload(): Promise<void> {
    this.loading.set(true);
    this.suppliers.set(await this.catalog.listSuppliers.execute());
    this.loading.set(false);
  }

  /** Digits only, to build the https://wa.me/<number> link. */
  protected digitsOnly(whatsapp: string): string {
    return whatsapp.replace(/\D/g, '');
  }

  protected edit(supplier: SupplierPrimitives): void {
    this.editingId.set(supplier.id);
    this.model.set({ name: supplier.name, whatsapp: supplier.whatsapp, notes: supplier.notes });
    this.form().reset();
    this.notice.set(null);
  }

  protected clearForm(): void {
    this.editingId.set(null);
    this.model.set({ name: '', whatsapp: '', notes: '' });
    this.form().reset();
    this.notice.set(null);
  }

  /** submit() marks every field as touched and only runs if valid. */
  protected save(): void {
    void submit(this.form, async () => {
      this.saving.set(true);
      this.notice.set(null);
      try {
        const r = await this.catalog.saveSupplier.execute({
          id: this.editingId() ?? undefined,
          ...this.model(),
        });
        this.notice.set({
          kind: 'ok',
          text: this.transloco.translate('catalog.suppliers.saved', { id: r.id }),
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
