import { Routes } from '@angular/router';
import { missionRedirectGuard, unlockGuard } from './features/game/unlock.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'map' },
  {
    path: 'map',
    loadComponent: () => import('./features/game/components/world-map/world-map').then(m => m.WorldMap),
  },
  {
    path: 'mission/:missionId/:stepId',
    canActivate: [unlockGuard],
    loadComponent: () =>
      import('./features/game/components/challenge-card/challenge-card').then(m => m.ChallengeCard),
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
      import('./features/game/components/level-completed/level-completed').then(m => m.LevelCompleted),
  },
  {
    path: 'system',
    loadComponent: () => import('./features/system/system').then(m => m.System),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard-screen').then(m => m.DashboardScreen) },
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
  { path: '**', redirectTo: 'map' },
];
