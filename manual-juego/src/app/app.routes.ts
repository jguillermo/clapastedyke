import { Routes } from '@angular/router';
import { missionRedirectGuard, unlockGuard } from './game/unlock.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'map' },
  {
    path: 'map',
    loadComponent: () => import('./game/components/world-map/world-map').then(m => m.WorldMap),
  },
  {
    path: 'mission/:missionId/:stepId',
    canActivate: [unlockGuard],
    loadComponent: () =>
      import('./game/components/challenge-card/challenge-card').then(m => m.ChallengeCard),
  },
  {
    // No step: lands on the mission's first pending step (guard always redirects).
    path: 'mission/:missionId',
    canActivate: [missionRedirectGuard],
    children: [],
  },
  {
    path: 'level/:levelId/completed',
    loadComponent: () =>
      import('./game/components/level-completed/level-completed').then(m => m.LevelCompleted),
  },
  {
    path: 'system',
    loadComponent: () => import('./system/system').then(m => m.System),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./system/dashboard/dashboard-screen').then(m => m.DashboardScreen) },
      { path: 'quotes', loadComponent: () => import('./system/quotes/quotes-screen').then(m => m.QuotesScreen) },
      { path: 'quotes/new', loadComponent: () => import('./system/quotes/quoter-screen').then(m => m.QuoterScreen) },
      { path: 'orders', loadComponent: () => import('./system/orders/orders-screen').then(m => m.OrdersScreen) },
      { path: 'purchases', loadComponent: () => import('./system/purchases/purchases-screen').then(m => m.PurchasesScreen) },
      { path: 'inventory', loadComponent: () => import('./system/inventory/inventory-screen').then(m => m.InventoryScreen) },
      { path: 'customers', loadComponent: () => import('./system/customers/customers-screen').then(m => m.CustomersScreen) },
      { path: 'suppliers', loadComponent: () => import('./system/suppliers/suppliers-screen').then(m => m.SuppliersScreen) },
      { path: 'supplies', loadComponent: () => import('./system/supplies/supplies-screen').then(m => m.SuppliesScreen) },
      { path: 'recipes', loadComponent: () => import('./system/recipes/recipes-screen').then(m => m.RecipesScreen) },
      { path: 'packaging-rules', loadComponent: () => import('./system/packaging-rules/packaging-rules-screen').then(m => m.PackagingRulesScreen) },
      { path: 'settings', loadComponent: () => import('./system/settings/settings-screen').then(m => m.SettingsScreen) },
    ],
  },
  { path: '**', redirectTo: 'map' },
];
