import { Routes } from '@angular/router';
import { physicalStoreGuard } from './features/_common/guards/physical-store.guard';

export const routes: Routes = [
  // El juego arranca en la cocina de casa (Fase 1). El pueblo (/town) es el
  // mundo de la Fase 4+ y se abre solo con PHYSICAL_STORE.
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/game/components/home/home-shell').then(m => m.HomeShell),
  },
  {
    // The town is the advanced world (Fase 4+). Its operational screens are its
    // children, rendered in the town's overlay outlet.
    path: 'town',
    canActivate: [physicalStoreGuard],
    loadComponent: () =>
      import('./features/game/components/town/town-shell').then(m => m.TownShell),
    children: [
      { path: 'quotes', loadComponent: () => import('./features/quotes/quotes-screen').then(m => m.QuotesScreen) },
      { path: 'quotes/new', loadComponent: () => import('./features/quotes/quoter-screen').then(m => m.QuoterScreen) },
      { path: 'orders', loadComponent: () => import('./features/orders/orders-screen').then(m => m.OrdersScreen) },
      { path: 'purchases', loadComponent: () => import('./features/purchases/purchases-screen').then(m => m.PurchasesScreen) },
      { path: 'inventory', loadComponent: () => import('./features/inventory/inventory-screen').then(m => m.InventoryScreen) },
      { path: 'customers', loadComponent: () => import('./features/customers/customers-screen').then(m => m.CustomersScreen) },
      { path: 'suppliers', loadComponent: () => import('./features/suppliers/suppliers-screen').then(m => m.SuppliersScreen) },
      { path: 'supplies', loadComponent: () => import('./features/supplies/supplies-screen').then(m => m.SuppliesScreen) },
      { path: 'recipes', loadComponent: () => import('./features/recipes/recipes-screen').then(m => m.RecipesScreen) },
      { path: 'packaging-rules', loadComponent: () => import('./features/packaging-rules/packaging-rules-screen').then(m => m.PackagingRulesScreen) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings-screen').then(m => m.SettingsScreen) },
    ],
  },
  // Rutas heredadas: el pueblo es el hub avanzado; los enlaces viejos caen ahí.
  { path: 'map', redirectTo: 'town', pathMatch: 'full' },
  { path: 'system', redirectTo: 'town', pathMatch: 'full' },
  { path: 'system/quotes/new', redirectTo: 'town/quotes/new' },
  { path: 'system/:section', redirectTo: 'town/:section' },
  { path: '**', redirectTo: 'home' },
];
