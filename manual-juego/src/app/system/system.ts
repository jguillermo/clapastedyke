import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * Layout of the real SYSTEM: the web as the business's main interface.
 * Side navigation by section; each screen uses the Bakery Costing use cases
 * against IndexedDB (via the composition root `Business`).
 */
@Component({
  selector: 'app-system',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoPipe],
  template: `
    <div class="cuerpo">
      <nav class="lateral">
        <p class="titulo-nav">{{ 'nav.system' | transloco }}</p>
        @for (s of sections; track s.route) {
          <a
            [routerLink]="s.route"
            routerLinkActive="activa"
            class="enlace"
            [class.proximamente]="s.pending"
          >
            {{ s.labelKey | transloco }}
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
      font-family: var(--font-mono);
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
    .enlace small { font-family: var(--font-mono); font-size: 9px; text-transform: uppercase; }
    .contenido { min-width: 0; }
    @media (max-width: 720px) {
      .cuerpo { grid-template-columns: 1fr; }
      .lateral { position: static; display: flex; flex-wrap: wrap; gap: 6px; }
      .titulo-nav { width: 100%; }
    }
  `,
})
export class System {
  protected readonly sections = [
    { labelKey: 'nav.home', route: 'dashboard', pending: false },
    { labelKey: 'nav.quotes', route: 'quotes', pending: false },
    { labelKey: 'nav.orders', route: 'orders', pending: false },
    { labelKey: 'nav.purchases', route: 'purchases', pending: false },
    { labelKey: 'nav.inventory', route: 'inventory', pending: false },
    { labelKey: 'nav.customers', route: 'customers', pending: false },
    { labelKey: 'nav.suppliers', route: 'suppliers', pending: false },
    { labelKey: 'nav.supplies', route: 'supplies', pending: false },
    { labelKey: 'nav.recipes', route: 'recipes', pending: false },
    { labelKey: 'nav.packagingRules', route: 'packaging-rules', pending: false },
    { labelKey: 'nav.settings', route: 'settings', pending: false },
  ];
}
