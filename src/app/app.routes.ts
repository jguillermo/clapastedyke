import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./features/game/home/home-3d').then((m) => m.Home3d),
  },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
];
