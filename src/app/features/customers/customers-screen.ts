import { Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { TranslocoPipe, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { CatalogService } from '../../core/catalog/catalog.service';
import { DomainError } from '../../core/_common/domain/errors';
import { CustomerPrimitives } from '../../core/catalog/domain/customer/customer';
import { UI_FORMS } from '../_common/directives/ui';

/**
 * Customers screen, live against IndexedDB. Signal Forms (Angular 21) for
 * per-field validation in the UI; BUSINESS rules (unique name…) stay in the
 * domain and arrive as a notice if the use case rejects them. Field validation
 * messages are stored as translation KEYS and resolved at render time.
 */
@Component({
  selector: 'app-customers-screen',
  imports: [...UI_FORMS, FormField, TranslocoPipe],
  providers: [provideTranslocoScope('catalog')],
  templateUrl: './customers-screen.html',
})
export class CustomersScreen {
  private readonly catalog = inject(CatalogService);
  private readonly transloco = inject(TranslocoService);

  protected readonly customers = signal<CustomerPrimitives[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly notice = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);
  protected readonly editingId = signal<string | null>(null);

  // Model + per-field validation form
  protected readonly model = signal({ name: '', phone: '', notes: '' });
  protected readonly form = form(this.model, field => {
    required(field.name, { message: 'catalog.customers.nameRequired' });
    maxLength(field.name, 80, { message: 'catalog.customers.nameMax' });
    maxLength(field.phone, 40, { message: 'catalog.customers.phoneMax' });
    maxLength(field.notes, 200, { message: 'catalog.customers.notesMax' });
  });

  constructor() {
    void this.reload();
  }

  protected async reload(): Promise<void> {
    this.loading.set(true);
    this.customers.set(await this.catalog.listCustomers.execute());
    this.loading.set(false);
  }

  protected edit(customer: CustomerPrimitives): void {
    this.editingId.set(customer.id);
    this.model.set({ name: customer.name, phone: customer.phone, notes: customer.notes });
    this.form().reset();
    this.notice.set(null);
  }

  protected clearForm(): void {
    this.editingId.set(null);
    this.model.set({ name: '', phone: '', notes: '' });
    this.form().reset();
    this.notice.set(null);
  }

  /** submit() marks every field as touched and only runs if valid. */
  protected save(): void {
    void submit(this.form, async () => {
      this.saving.set(true);
      this.notice.set(null);
      try {
        const r = await this.catalog.saveCustomer.execute({
          id: this.editingId() ?? undefined,
          ...this.model(),
        });
        this.notice.set({
          kind: 'ok',
          text: this.transloco.translate('catalog.customers.saved', { id: r.id }),
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
