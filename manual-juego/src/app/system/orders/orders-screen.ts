import { Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { Business } from '../../composition/business';
import { DomainError } from '../../business/shared/domain/errors';
import { CustomerPrimitives } from '../../business/catalog/domain/customer/customer';
import { OrderStatus } from '../../business/sales/domain/order/order';
import { OrderListItem } from '../../business/sales/application/list-orders/list-orders';
import { UI_FORMS } from '../../forms/ui/ui';

type StatusFilter = '' | OrderStatus;

/**
 * ORDERS SCREEN: the sale-cycle board (PD-). The view does NOT compute or
 * format: `OrderListItem` already brings the formatted dates and the
 * requirements with their `shortage`. Business rules (no delivery without
 * production, etc.) live in the domain and arrive as a red notice if the use
 * case rejects them (DomainError).
 */
@Component({
  selector: 'app-orders-screen',
  imports: [...UI_FORMS, TranslocoPipe],
  templateUrl: './orders-screen.html',
  providers: [provideTranslocoScope('operations')],
})
export class OrdersScreen {
  private readonly business = inject(Business);
  private readonly transloco = inject(TranslocoService);

  protected readonly orders = signal<OrderListItem[]>([]);
  protected readonly customers = signal<CustomerPrimitives[]>([]);
  protected readonly loading = signal(true);
  protected readonly processing = signal(false);
  protected readonly notice = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Open detail row (shows the requirements below).
  protected readonly openOrder = signal<string | null>(null);

  // Filters (plain signals, no formField). They reload on change.
  protected readonly statusFilter = signal<StatusFilter>('');
  protected readonly customerFilter = signal<string>('');

  protected readonly statuses: readonly OrderStatus[] = [
    'Pending',
    'InProduction',
    'Delivered',
    'Cancelled',
  ];

  constructor() {
    void this.loadCustomers();
    void this.reload();
  }

  private async loadCustomers(): Promise<void> {
    this.customers.set(await this.business.listCustomers.execute());
  }

  protected async reload(): Promise<void> {
    this.loading.set(true);
    this.orders.set(
      await this.business.listOrders.execute({
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

  /** Status badge classes. */
  protected readonly statusClasses: Record<OrderStatus, string> = {
    Pending: 'bg-amber-soft text-amber',
    InProduction: 'bg-accent-soft text-accent-deep',
    Delivered: 'bg-green-soft text-green',
    Cancelled: 'bg-red-soft text-red',
  };

  protected toggleDetail(id: string): void {
    this.openOrder.update(current => (current === id ? null : id));
  }

  protected async startProduction(o: OrderListItem): Promise<void> {
    const confirmText = this.transloco.translate('operations.orders.startProductionConfirm', {
      id: o.id,
    });
    if (!window.confirm(confirmText)) return;
    await this.action(
      () => this.business.startProduction.execute({ orderId: o.id }),
      this.transloco.translate('operations.orders.startedNotice', { id: o.id }),
    );
  }

  protected async deliver(o: OrderListItem): Promise<void> {
    const confirmText = this.transloco.translate('operations.orders.deliverConfirm', { id: o.id });
    if (!window.confirm(confirmText)) return;
    await this.action(async () => {
      const r = await this.business.markDelivered.execute({ orderId: o.id });
      return this.transloco.translate('operations.orders.deliveredNotice', { saleId: r.saleId });
    });
  }

  protected async cancel(o: OrderListItem): Promise<void> {
    const promptText = this.transloco.translate('operations.orders.cancelPrompt');
    const reason = window.prompt(promptText, '');
    if (reason === null) return; // cancelling the prompt aborts
    await this.action(
      () => this.business.cancelOrder.execute({ orderId: o.id, reason }),
      this.transloco.translate('operations.orders.cancelledNotice', { id: o.id }),
    );
  }

  /**
   * Runs a transition and refreshes. `work` may return the notice text (e.g.
   * the saleId), or `okText` is used when it is fixed.
   */
  private async action(
    work: () => Promise<string | void>,
    okText?: string,
  ): Promise<void> {
    this.processing.set(true);
    this.notice.set(null);
    try {
      const text = await work();
      this.notice.set({ kind: 'ok', text: (typeof text === 'string' ? text : okText) ?? '' });
      await this.reload();
    } catch (error) {
      const text =
        error instanceof DomainError
          ? error.message
          : this.transloco.translate('operations.orders.couldNotComplete');
      this.notice.set({ kind: 'err', text });
    } finally {
      this.processing.set(false);
    }
  }

  protected readonly hasOrders = computed(() => this.orders().length > 0);
}
