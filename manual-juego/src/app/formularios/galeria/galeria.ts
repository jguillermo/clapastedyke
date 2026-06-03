import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FORMULARIOS } from '../registro-formularios';

/** /formularios — índice de los formularios migrados. */
@Component({
  selector: 'app-galeria-formularios',
  imports: [RouterLink],
  template: `
    <h1>Formularios del sistema</h1>
    <p class="sub">
      Capa visual de los diálogos del add-on. Desde aquí se renderizan y, con
      <code>npm run exportar:formularios</code>, se convierten en los HTML
      autónomos de <code>src/</code>.
    </p>
    <div class="lista">
      @for (f of formularios; track f.id) {
        <a class="item" [routerLink]="['/formularios', f.id]">
          <b>{{ f.titulo }}</b>
          <small>{{ f.archivoGas }}.html</small>
        </a>
      }
    </div>
  `,
  styles: `
    :host { display: block; max-width: 680px; margin: 0 auto; padding: 30px 18px 60px; }
    h1 { font-size: clamp(28px, 6vw, 40px); margin: 0 0 8px; }
    .sub { color: var(--muted); font-size: 14.5px; margin: 0 0 20px; }
    code { font-family: var(--fuente-mono); font-size: .85em; background: var(--accent-soft); border-radius: 5px; padding: 1px 5px; }
    .lista { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .item {
      display: flex; flex-direction: column; gap: 2px;
      background: var(--sheet); border: 1px solid var(--line); border-radius: 14px;
      padding: 14px 16px; text-decoration: none; color: var(--ink);
      transition: border-color .2s, transform .2s, box-shadow .2s;
    }
    .item:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
    .item b { font-family: var(--fuente-titulo); font-size: 16px; }
    .item small { font-family: var(--fuente-mono); font-size: 10.5px; color: var(--muted); }
  `,
})
export class GaleriaFormularios {
  protected readonly formularios = FORMULARIOS;
}
