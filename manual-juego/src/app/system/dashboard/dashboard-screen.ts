import { Component, inject, signal } from '@angular/core';
import { SafeSvgPipe } from '../../svg/safe-svg.pipe';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Business } from '../../composition/business';
import { AlertType, DashboardData } from '../../business/dashboard/application/get-dashboard/get-dashboard';
import { ICONS } from '../../svg/icons';
import { UI_FORMS } from '../../forms/ui/ui';

interface Access {
  id: string;
  route: string;
  icon: string;
}

/**
 * Dashboard: the day's panel (doc/diseno_visual_interfaz.html). The KPIs and the
 * «needs your attention» alerts are computed by GetDashboard — here we only paint.
 * Texts are composed via Transloco from the DTO's pure data + keys.
 */
@Component({
  selector: 'app-dashboard-screen',
  imports: [SafeSvgPipe, RouterLink, TranslocoPipe, ...UI_FORMS],
  templateUrl: './dashboard-screen.html',
})
export class DashboardScreen {
  private readonly business = inject(Business);

  protected readonly dashboard = signal<DashboardData | null>(null);

  protected readonly accesses: Access[] = [
    { id: 'newQuote', route: '/system/quotes/new', icon: ICONS['f01'] },
    { id: 'viewQuotes', route: '/system/quotes', icon: ICONS['f02'] },
    { id: 'viewOrders', route: '/system/orders', icon: ICONS['f03'] },
    { id: 'buyMaterials', route: '/system/purchases', icon: ICONS['f05'] },
    { id: 'registerPurchase', route: '/system/purchases', icon: ICONS['f12'] },
    { id: 'adjustInventory', route: '/system/inventory', icon: ICONS['f06'] },
    { id: 'catalogs', route: '/system/customers', icon: ICONS['f10'] },
    { id: 'settings', route: '/system/settings', icon: ICONS['f13'] },
  ];

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.dashboard.set(await this.business.getDashboard.execute());
  }

  /** Left border of the KPI card according to its business color. */
  protected kpiBorderClass(color: string): string {
    const borders: Record<string, string> = {
      accent: 'border-l-accent',
      amber: 'border-l-amber',
      muted: 'border-l-muted',
      green: 'border-l-green',
      red: 'border-l-red',
    };
    return borders[color] ?? 'border-l-line';
  }

  protected kpiNumberClass(color: string): string {
    const colors: Record<string, string> = {
      accent: 'text-accent',
      amber: 'text-amber',
      muted: 'text-muted',
      green: 'text-green',
      red: 'text-red',
    };
    return colors[color] ?? 'text-ink';
  }

  protected badgeClass(type: AlertType): string {
    const classes: Record<AlertType, string> = {
      expiringQuote: 'bg-amber-soft text-amber',
      expiredQuote: 'bg-amber-soft text-amber',
      outOfStock: 'bg-red-soft text-red',
      belowMinimum: 'bg-amber-soft text-amber',
      toDeliver: 'bg-green-soft text-green',
    };
    return classes[type];
  }

  /** Badge i18n key per alert type (expiring quotes branch by daysLeft). */
  protected badgeKey(type: AlertType, daysLeft?: number): string {
    if (type === 'expiringQuote') {
      if (daysLeft == null || daysLeft <= 0) return 'dashboard.alert.badge.expiresToday';
      if (daysLeft === 1) return 'dashboard.alert.badge.expiresTomorrow';
      return 'dashboard.alert.badge.expiresInDays';
    }
    const keys: Record<AlertType, string> = {
      expiringQuote: 'dashboard.alert.badge.expiresInDays',
      expiredQuote: 'dashboard.alert.badge.expired',
      outOfStock: 'dashboard.alert.badge.outOfStock',
      belowMinimum: 'dashboard.alert.badge.belowMinimum',
      toDeliver: 'dashboard.alert.badge.toDeliver',
    };
    return keys[type];
  }
}
