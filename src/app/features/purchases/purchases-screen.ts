import { Component, computed, inject, signal } from '@angular/core';
import { FormField, applyEach, form, min, required, submit } from '@angular/forms/signals';
import { TranslocoPipe, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { CatalogService } from '../../core/catalog/catalog.service';
import { SalesService } from '../../core/sales/sales.service';
import { InventoryService } from '../../core/inventory/inventory.service';
import { DomainError } from '../../core/_common/domain/errors';
import { SupplierPrimitives } from '../../core/catalog/domain/supplier/supplier';
import { SupplyListItem } from '../../core/catalog/application/list-supplies/list-supplies';
import { OrderListItem } from '../../core/sales/application/list-orders/list-orders';
import { ShoppingListItem } from '../../core/inventory/application/shopping-list/shopping-list';
import { PurchaseListItem } from '../../core/inventory/application/list-purchases/list-purchases';
import { UI_FORMS } from '../_common/directives/ui';

type ListMode = 'auto' | 'manual';

interface PurchaseModel {
  supplierId: string;
  date: string;
  lines: { supplyId: string; receivedPresentations: number; paidPresentationPriceSoles: number }[];
}

/**
 * PURCHASES SCREEN: three cards. (1) «Buy materials» builds the order list for
 * the supplier (auto = an order's shortages / manual = supplies below minimum)
 * and does NOT touch stock. (2) «Record received purchase» is the form with
 * DYNAMIC LINES (applyEach) that raises stock and updates prices. (3)
 * «History» lists the already-recorded purchases. The view does NOT compute or
 * format: the DTOs arrive ready from the business.
 */
@Component({
  selector: 'app-purchases-screen',
  imports: [...UI_FORMS, FormField, TranslocoPipe],
  templateUrl: './purchases-screen.html',
  providers: [provideTranslocoScope('operations')],
})
export class PurchasesScreen {
  private readonly catalog = inject(CatalogService);
  private readonly sales = inject(SalesService);
  private readonly inventory = inject(InventoryService);
  private readonly transloco = inject(TranslocoService);

  // --- Card 1: buy materials (supplier list) ---
  protected readonly mode = signal<ListMode>('auto');
  protected readonly orders = signal<OrderListItem[]>([]);
  protected readonly orderId = signal<string>('');
  protected readonly items = signal<ShoppingListItem[]>([]);
  protected readonly loadingItems = signal(false);

  /** Only orders that have some requirement with shortage > 0 (filter, not a calc). */
  protected readonly ordersWithShortages = computed(() =>
    this.orders().filter(o => o.requirements.some(r => r.shortage > 0)),
  );

  // --- Card 2: record received purchase (Signal Forms + dynamic lines) ---
  protected readonly suppliers = signal<SupplierPrimitives[]>([]);
  protected readonly supplies = signal<SupplyListItem[]>([]);
  protected readonly saving = signal(false);
  protected readonly notice = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);

  protected readonly model = signal<PurchaseModel>({ supplierId: '', date: '', lines: [] });
  protected readonly form = form(this.model, field => {
    required(field.supplierId, { message: 'operations.purchases.supplierRequired' });
    applyEach(field.lines, line => {
      required(line.supplyId, { message: 'operations.purchases.supplyRequired' });
      min(line.receivedPresentations, 0.0001, { message: 'operations.purchases.greaterThanZero' });
      min(line.paidPresentationPriceSoles, 0.01, { message: 'operations.purchases.greaterThanZero' });
    });
  });

  // --- Card 3: history ---
  protected readonly purchases = signal<PurchaseListItem[]>([]);
  protected readonly loadingHistory = signal(true);
  protected readonly expanded = signal<string | null>(null);

  constructor() {
    void this.loadCatalogs();
    void this.reloadHistory();
    void this.loadItems();
  }

  private async loadCatalogs(): Promise<void> {
    this.suppliers.set(await this.catalog.listSuppliers.execute());
    this.supplies.set(await this.catalog.listSupplies.execute({}));
    this.orders.set(await this.sales.listOrders.execute({}));
  }

  // ---------- Card 1 ----------
  protected changeMode(mode: ListMode): void {
    this.mode.set(mode);
    void this.loadItems();
  }

  protected chooseOrder(id: string): void {
    this.orderId.set(id);
    void this.loadItems();
  }

  /** Loads the items and orders them by supplier (sort, not a calc). */
  protected async loadItems(): Promise<void> {
    this.loadingItems.set(true);
    let list: ShoppingListItem[] = [];
    if (this.mode() === 'manual') {
      list = await this.inventory.suppliesBelowMinimum.execute();
    } else if (this.orderId()) {
      list = await this.sales.orderShortages.execute({ orderId: this.orderId() });
    }
    list = [...list].sort((a, b) =>
      this.supplierLabel(a).localeCompare(this.supplierLabel(b), 'es'),
    );
    this.items.set(list);
    this.loadingItems.set(false);
  }

  /** Supplier name, or the root «no supplier» label when null. */
  protected supplierLabel(item: ShoppingListItem): string {
    return item.supplierName ?? this.transloco.translate('common.noSupplier');
  }

  // ---------- Card 2 ----------
  protected addLine(): void {
    this.model.update(m => ({
      ...m,
      lines: [...m.lines, { supplyId: '', receivedPresentations: 0, paidPresentationPriceSoles: 0 }],
    }));
  }

  protected removeLine(index: number): void {
    this.model.update(m => ({ ...m, lines: m.lines.filter((_, i) => i !== index) }));
  }

  protected clear(): void {
    this.model.set({ supplierId: '', date: '', lines: [] });
    this.form().reset();
    this.notice.set(null);
  }

  /** submit() marks everything touched and only runs if valid. */
  protected save(): void {
    void submit(this.form, async () => {
      this.saving.set(true);
      this.notice.set(null);
      try {
        const m = this.model();
        const r = await this.inventory.registerPurchase.execute({
          supplierId: m.supplierId,
          ...(m.date ? { date: m.date } : {}),
          lines: m.lines.map(l => ({
            supplyId: l.supplyId,
            receivedPresentations: l.receivedPresentations,
            paidPresentationPriceSoles: l.paidPresentationPriceSoles,
          })),
        });
        this.notice.set({
          kind: 'ok',
          text: this.transloco.translate('operations.purchases.registeredNotice', { id: r.id }),
        });
        this.clear();
        await this.reloadHistory();
        // Stock changed: refresh supplies and the materials list if in manual mode.
        await this.loadCatalogs();
        await this.loadItems();
      } catch (error) {
        const text =
          error instanceof DomainError
            ? error.message
            : this.transloco.translate('operations.purchases.couldNotRegister');
        this.notice.set({ kind: 'err', text });
      } finally {
        this.saving.set(false);
      }
    });
  }

  // ---------- Card 3 ----------
  protected async reloadHistory(): Promise<void> {
    this.loadingHistory.set(true);
    this.purchases.set(await this.inventory.listPurchases.execute());
    this.loadingHistory.set(false);
  }

  protected toggleExpanded(id: string): void {
    this.expanded.update(current => (current === id ? null : id));
  }
}
