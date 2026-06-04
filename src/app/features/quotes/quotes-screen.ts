import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { CatalogService } from '../../core/catalog/catalog.service';
import { SalesService } from '../../core/sales/sales.service';
import { DomainError } from '../../core/_common/domain/errors';
import { QuoteListItem } from '../../core/sales/application/list-quotes/list-quotes';
import { VisibleQuoteStatus } from '../../core/sales/domain/quote/quote';
import { CustomerPrimitives } from '../../core/catalog/domain/customer/customer';
import { UI_FORMS } from '../_common/directives/ui';

type StatusFilter = '' | VisibleQuoteStatus;

/**
 * QUOTES LIST: the tracking screen. Simple signal filters (status and
 * customer) that reload on change; the Approve/Reject actions only appear on
 * Pending quotes and delegate to the business (which decides order, stock and
 * shortages). The view neither computes nor formats: the DTOs
 * (`QuoteListItem`) already carry visibleStatus and the *Formatted fields.
 */
@Component({
  selector: 'app-quotes-screen',
  imports: [...UI_FORMS, RouterLink, TranslocoPipe],
  templateUrl: './quotes-screen.html',
  providers: [provideTranslocoScope('sales')],
})
export class QuotesScreen {
  private readonly catalog = inject(CatalogService);
  private readonly sales = inject(SalesService);
  private readonly transloco = inject(TranslocoService);

  protected readonly quotes = signal<QuoteListItem[]>([]);
  protected readonly customers = signal<CustomerPrimitives[]>([]);
  protected readonly loading = signal(true);
  protected readonly processing = signal(false);
  protected readonly notice = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Filters: plain signals (not formField) that trigger a reload.
  protected readonly statusFilter = signal<StatusFilter>('');
  protected readonly customerFilter = signal<string>('');

  constructor() {
    void this.loadCustomers();
    void this.reload();
  }

  private async loadCustomers(): Promise<void> {
    this.customers.set(await this.catalog.listCustomers.execute());
  }

  protected async reload(): Promise<void> {
    this.loading.set(true);
    this.quotes.set(
      await this.sales.listQuotes.execute({
        status: this.statusFilter() || undefined,
        customerId: this.customerFilter() || undefined,
      }),
    );
    this.loading.set(false);
  }

  protected changeStatus(value: string): void {
    this.statusFilter.set(value as StatusFilter);
    void this.reload();
  }

  protected changeCustomer(value: string): void {
    this.customerFilter.set(value);
    void this.reload();
  }

  protected async approve(q: QuoteListItem): Promise<void> {
    const confirmText = this.transloco.translate('sales.quotes.approveConfirm', { id: q.id });
    if (!window.confirm(confirmText)) return;
    this.processing.set(true);
    this.notice.set(null);
    try {
      const r = await this.sales.approveQuote.execute({ quoteId: q.id });
      let text = this.transloco.translate('sales.quotes.approved', { orderId: r.orderId });
      if (r.shortages.length) {
        const list = r.shortages.map(s => `${s.supplyName} (${s.shortage})`).join(', ');
        text += ' ' + this.transloco.translate('sales.quotes.shortages', { list });
      }
      this.notice.set({ kind: 'ok', text });
      await this.reload();
    } catch (error) {
      const text =
        error instanceof DomainError
          ? error.message
          : this.transloco.translate('sales.quotes.couldNotApprove');
      this.notice.set({ kind: 'err', text });
    } finally {
      this.processing.set(false);
    }
  }

  protected async reject(q: QuoteListItem): Promise<void> {
    const promptText = this.transloco.translate('sales.quotes.rejectPrompt', { id: q.id });
    const reason = window.prompt(promptText);
    if (reason === null) return; // cancelled
    this.processing.set(true);
    this.notice.set(null);
    try {
      await this.sales.rejectQuote.execute({ quoteId: q.id, reason });
      this.notice.set({
        kind: 'ok',
        text: this.transloco.translate('sales.quotes.rejected', { id: q.id }),
      });
      await this.reload();
    } catch (error) {
      const text =
        error instanceof DomainError
          ? error.message
          : this.transloco.translate('sales.quotes.couldNotReject');
      this.notice.set({ kind: 'err', text });
    } finally {
      this.processing.set(false);
    }
  }

  /** Status badge classes (the view only picks a color, it computes nothing). */
  protected statusClasses(status: VisibleQuoteStatus): string {
    switch (status) {
      case 'Approved':
        return 'bg-green-soft text-green border-green/30';
      case 'Rejected':
        return 'bg-red-soft text-red border-red/30';
      case 'Expired':
        return 'bg-paper text-muted border-line';
      default: // Pending
        return 'bg-amber/15 text-amber border-amber/30';
    }
  }
}
