import { Injectable, inject } from '@angular/core';
import { CatalogService } from '../catalog/catalog.service';
import { SalesService } from '../sales/sales.service';
import { SettingsService } from '../settings/settings.service';
import { GetDashboard } from './application/get-dashboard/get-dashboard';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly catalog = inject(CatalogService);
  private readonly sales = inject(SalesService);
  private readonly settings = inject(SettingsService);

  readonly getDashboard = new GetDashboard(
    this.sales.quoteRepo, this.sales.orderRepo, this.catalog.supplyRepo, this.settings.settingsRepo,
  );
}
