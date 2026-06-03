import { UseCase } from '../../../shared/application/use-case';
import { formatLongDate } from '../../../shared/application/formats';
import { SettingsRepository } from '../../../settings/domain/settings-repository';
import { SupplyRepository } from '../../../catalog/domain/supply/supply-repository';
import { OrderRepository } from '../../../sales/domain/order/order-repository';
import { QuoteRepository } from '../../../sales/domain/quote/quote-repository';

/**
 * READ projection of the Home panel (the GAS «Resumen»): the day's KPIs and the
 * «needs your attention» list, computed here — the view only paints. Because
 * the UI now translates with Transloco, the DTO returns PURE DATA + keys, never
 * assembled phrases.
 */

export type AlertType =
  | 'expiringQuote'
  | 'expiredQuote'
  | 'outOfStock'
  | 'belowMinimum'
  | 'toDeliver';

export interface DashboardAlert {
  type: AlertType;
  /** '/system/quotes' | '/system/purchases' | '/system/orders' */
  route: string;
  /** The view translates the action label. */
  action: 'view' | 'buy';
  /** Data to compose the text in the view: */
  refId?: string; // P-0042 / PD-0019
  name?: string; // customerName or supplyName
  daysLeft?: number; // expiringQuote
  stock?: number; // outOfStock / belowMinimum
  minStock?: number; // belowMinimum
  unit?: string; // outOfStock / belowMinimum
}

export interface DashboardKpi {
  value: number;
  key: 'pendingQuotes' | 'expiringThisWeek' | 'pendingOrders' | 'toDeliver' | 'suppliesInRed';
  color: 'accent' | 'amber' | 'muted' | 'green' | 'red';
}

export interface DashboardData {
  longDate: string;
  kpis: DashboardKpi[];
  alerts: DashboardAlert[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

export class GetDashboard implements UseCase<void, DashboardData> {
  constructor(
    private readonly quotes: QuoteRepository,
    private readonly orders: OrderRepository,
    private readonly supplies: SupplyRepository,
    private readonly settings: SettingsRepository,
  ) {}

  async execute(): Promise<DashboardData> {
    const today = new Date();
    const [allQuotes, allOrders, allSupplies] = await Promise.all([
      this.quotes.all(),
      this.orders.all(),
      this.supplies.all(),
    ]);

    /* ---------- KPIs ---------- */
    const pending = allQuotes.filter(q => q.visibleStatus(today) === 'Pending');
    const expiringThisWeek = pending.filter(q => {
      const days = (q.expiresAt.getTime() - today.getTime()) / DAY_MS;
      return days >= 0 && days <= 7;
    });
    const pendingOrders = allOrders.filter(o => o.status === 'Pending');
    const toDeliver = allOrders.filter(o => o.status === 'InProduction');
    const suppliesInRed = allSupplies.filter(s => s.stockLight === 'red');

    const kpis: DashboardKpi[] = [
      { value: pending.length, key: 'pendingQuotes', color: 'accent' },
      { value: expiringThisWeek.length, key: 'expiringThisWeek', color: 'amber' },
      { value: pendingOrders.length, key: 'pendingOrders', color: 'muted' },
      { value: toDeliver.length, key: 'toDeliver', color: 'green' },
      { value: suppliesInRed.length, key: 'suppliesInRed', color: 'red' },
    ];

    /* ---------- Needs your attention ---------- */
    const alerts: DashboardAlert[] = [];

    // Quotes expiring soon (≤ 3 days) or already expired
    for (const q of allQuotes) {
      const visible = q.visibleStatus(today);
      if (visible === 'Expired') {
        alerts.push({
          type: 'expiredQuote',
          route: '/system/quotes',
          action: 'view',
          refId: q.id.value,
          name: q.customerName,
        });
        continue;
      }
      if (visible !== 'Pending') continue;
      const days = Math.ceil((q.expiresAt.getTime() - today.getTime()) / DAY_MS);
      if (days > 3) continue;
      alerts.push({
        type: 'expiringQuote',
        route: '/system/quotes',
        action: 'view',
        refId: q.id.value,
        name: q.customerName,
        daysLeft: days,
      });
    }

    // Out-of-stock and below-minimum supplies
    for (const s of allSupplies) {
      if (s.stockLight === 'red') {
        alerts.push({
          type: 'outOfStock',
          route: '/system/purchases',
          action: 'buy',
          name: s.name,
          stock: s.stock,
          unit: s.baseUnit,
        });
      } else if (s.stockLight === 'yellow') {
        alerts.push({
          type: 'belowMinimum',
          route: '/system/purchases',
          action: 'buy',
          name: s.name,
          stock: s.stock,
          minStock: s.minStock,
          unit: s.baseUnit,
        });
      }
    }

    // Orders in production ready to deliver
    for (const o of toDeliver) {
      alerts.push({
        type: 'toDeliver',
        route: '/system/orders',
        action: 'view',
        refId: o.id.value,
        name: o.customerName,
      });
    }

    const language = (await this.settings.get()).general.language;
    return { longDate: formatLongDate(today, language), kpis, alerts };
  }
}
