import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Layout del SISTEMA real: la web como interfaz principal del negocio.
 * Navegación lateral por secciones; cada pantalla usa los casos de uso del
 * BC Costeo contra IndexedDB (vía la raíz de composición `Negocio`).
 */
@Component({
  selector: 'app-sistema',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="cuerpo">
      <nav class="lateral">
        <p class="titulo-nav">Sistema</p>
        @for (s of secciones; track s.ruta) {
          <a
            [routerLink]="s.ruta"
            routerLinkActive="activa"
            class="enlace"
            [class.proximamente]="s.pendiente"
          >
            {{ s.nombre }}
            @if (s.pendiente) { <small>pronto</small> }
          </a>
        }
      </nav>
      <main class="contenido">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    :host { display: block; }
    .cuerpo {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 22px;
      max-width: 1060px;
      margin: 0 auto;
      padding: 26px 18px 70px;
    }
    .lateral { position: sticky; top: 76px; align-self: start; }
    .titulo-nav {
      font-family: var(--fuente-mono);
      font-size: 11px;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: var(--accent);
      margin: 0 0 10px 12px;
    }
    .enlace {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 9px 12px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      color: var(--ink);
      text-decoration: none;
      transition: background .15s;
    }
    .enlace:hover { background: var(--accent-soft); }
    .enlace.activa { background: var(--accent); color: #fff; }
    .enlace.proximamente { color: var(--muted); pointer-events: none; }
    .enlace small { font-family: var(--fuente-mono); font-size: 9px; text-transform: uppercase; }
    .contenido { min-width: 0; }
    @media (max-width: 720px) {
      .cuerpo { grid-template-columns: 1fr; }
      .lateral { position: static; display: flex; flex-wrap: wrap; gap: 6px; }
      .titulo-nav { width: 100%; }
    }
  `,
})
export class Sistema {
  protected readonly secciones = [
    { nombre: 'Inicio', ruta: 'resumen', pendiente: false },
    { nombre: 'Presupuestos', ruta: 'presupuestos', pendiente: false },
    { nombre: 'Pedidos', ruta: 'pedidos', pendiente: false },
    { nombre: 'Compras', ruta: 'compras', pendiente: false },
    { nombre: 'Inventario', ruta: 'inventario', pendiente: false },
    { nombre: 'Clientes', ruta: 'clientes', pendiente: false },
    { nombre: 'Proveedores', ruta: 'proveedores', pendiente: false },
    { nombre: 'Insumos', ruta: 'insumos', pendiente: false },
    { nombre: 'Recetas', ruta: 'recetas', pendiente: false },
    { nombre: 'Reglas de empaque', ruta: 'reglas-empaque', pendiente: false },
    { nombre: 'Configuración', ruta: 'configuracion', pendiente: false },
  ];
}
