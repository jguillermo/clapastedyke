import { Component, input } from '@angular/core';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { StockStatus } from '../../../core/catalog/domain/supply/supply';

/**
 * Estado de stock como color + icono + etiqueta (nunca solo color).
 * Fuente: .claude/doc/diseno_componentes.md (StatusBadge).
 */
@Component({
  selector: 'app-status-badge',
  imports: [TranslocoPipe],
  providers: [provideTranslocoScope('game')],
  template: `
    <span class="badge" [class]="'badge--' + status().toLowerCase()">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path [attr.d]="icon()"></path>
        @if (status() === 'OK') { <path d="m9 12 2 2 4-4"></path> }
        @else { <line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line> }
      </svg>
      {{ 'game.home.stock.' + status().toLowerCase() | transloco }}
    </span>
  `,
  styles: `
    .badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: var(--radius-pill);
      font: 500 12px/1.4 var(--font-body);
    }
    .badge--empty { color: var(--color-danger); background: var(--color-danger-soft); }
    .badge--low { color: var(--color-warning); background: var(--color-warning-soft); }
    .badge--ok { color: var(--color-success); background: var(--color-success-soft); }
    .badge svg { width: 14px; height: 14px; }
  `,
})
export class StatusBadge {
  readonly status = input.required<StockStatus>();

  // circle-alert / triangle-alert / circle-check (contorno base).
  protected icon(): string {
    return this.status() === 'OK'
      ? 'M21.801 10A10 10 0 1 1 17 3.335'
      : this.status() === 'LOW'
        ? 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'
        : 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20';
  }
}
