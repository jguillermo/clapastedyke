import { Routes } from '@angular/router';
import { desbloqueoGuard, redirigirMisionGuard } from './rutas/desbloqueo.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'mapa' },
  {
    path: 'mapa',
    loadComponent: () =>
      import('./componentes/mapa-mundo/mapa-mundo').then(m => m.MapaMundo),
  },
  {
    path: 'mision/:misionId/:pasoId',
    canActivate: [desbloqueoGuard],
    loadComponent: () =>
      import('./componentes/tarjeta-reto/tarjeta-reto').then(m => m.TarjetaReto),
  },
  {
    // Sin paso: cae en el primer paso pendiente de la misión (el guard redirige siempre).
    path: 'mision/:misionId',
    canActivate: [redirigirMisionGuard],
    children: [],
  },
  {
    path: 'nivel/:nivelId/completado',
    loadComponent: () =>
      import('./componentes/nivel-completado/nivel-completado').then(m => m.NivelCompletado),
  },
  {
    path: 'formularios',
    loadComponent: () =>
      import('./formularios/galeria/galeria').then(m => m.GaleriaFormularios),
  },
  {
    path: 'formularios/:id',
    loadComponent: () =>
      import('./formularios/visor/visor').then(m => m.VisorFormulario),
  },
  { path: '**', redirectTo: 'mapa' },
];
