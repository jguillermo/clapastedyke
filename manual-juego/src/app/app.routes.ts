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
    path: 'sistema',
    loadComponent: () => import('./sistema/sistema').then(m => m.Sistema),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'resumen' },
      {
        path: 'resumen',
        loadComponent: () =>
          import('./sistema/resumen/pantalla-resumen').then(m => m.PantallaResumen),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./sistema/clientes/pantalla-clientes').then(m => m.PantallaClientes),
      },
      {
        path: 'proveedores',
        loadComponent: () =>
          import('./sistema/proveedores/pantalla-proveedores').then(m => m.PantallaProveedores),
      },
      {
        path: 'insumos',
        loadComponent: () =>
          import('./sistema/insumos/pantalla-insumos').then(m => m.PantallaInsumos),
      },
      {
        path: 'recetas',
        loadComponent: () =>
          import('./sistema/recetas/pantalla-recetas').then(m => m.PantallaRecetas),
      },
      {
        path: 'reglas-empaque',
        loadComponent: () =>
          import('./sistema/reglas-empaque/pantalla-reglas-empaque').then(m => m.PantallaReglasEmpaque),
      },
      {
        path: 'presupuestos',
        loadComponent: () =>
          import('./sistema/presupuestos/pantalla-presupuestos').then(m => m.PantallaPresupuestos),
      },
      {
        path: 'presupuestos/nuevo',
        loadComponent: () => import('./sistema/presupuestos/cotizador').then(m => m.Cotizador),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./sistema/pedidos/pantalla-pedidos').then(m => m.PantallaPedidos),
      },
      {
        path: 'compras',
        loadComponent: () =>
          import('./sistema/compras/pantalla-compras').then(m => m.PantallaCompras),
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./sistema/inventario/pantalla-inventario').then(m => m.PantallaInventario),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./sistema/configuracion/pantalla-configuracion').then(m => m.PantallaConfiguracion),
      },
    ],
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
