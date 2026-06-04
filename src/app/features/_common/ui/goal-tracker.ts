import { Component, computed, input } from '@angular/core';
import { Goal } from '../../../core/progression/domain/goal';
import { GoalType } from '../../../core/progression/domain/goal-type';

/**
 * Progreso de las metas del nivel actual (cuánto falta), sin abrumar.
 * Fuente: .claude/doc/diseno_componentes.md (GoalTracker).
 */
@Component({
  selector: 'app-goal-tracker',
  template: `
    <ul class="goals">
      @for (g of goals(); track g.type) {
        <li class="goal" [class.goal--done]="g.met">
          <div class="goal__row">
            <span class="goal__label">{{ label(g) }}</span>
            <span class="goal__count">{{ shown(g) }} / {{ g.target }}</span>
          </div>
          <div class="goal__bar"><div class="goal__fill" [style.width.%]="percent(g)"></div></div>
        </li>
      }
    </ul>
  `,
  styles: `
    .goals { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .goal__row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
    .goal__label { font: 500 14px/1.3 var(--font-body); color: var(--color-ink); }
    .goal__count { font: 600 14px/1.3 var(--font-body); color: var(--color-ink-soft); font-variant-numeric: tabular-nums; }
    .goal__bar { height: 6px; border-radius: var(--radius-pill); background: var(--color-border); overflow: hidden; }
    .goal__fill { height: 100%; border-radius: inherit; background: var(--color-primary); transition: width var(--dur-slow) var(--ease-out); }
    .goal--done .goal__fill { background: var(--color-success); }
    .goal--done .goal__label { color: var(--color-success); }
  `,
})
export class GoalTracker {
  readonly goals = input.required<Goal[]>();

  protected label(g: Goal): string {
    return LABELS[g.type] ?? g.type;
  }
  protected shown(g: Goal): number {
    return Math.min(g.progress, g.target);
  }
  protected percent(g: Goal): number {
    return g.target > 0 ? Math.min(100, Math.round((g.progress / g.target) * 100)) : 0;
  }
}

/** Etiqueta amable en español por tipo de meta. */
const LABELS: Partial<Record<GoalType, string>> = {
  [GoalType.PURCHASES_REGISTERED]: 'Comprar ingredientes',
  [GoalType.WAREHOUSES_STOCKED]: 'Almacenes abastecidos',
  [GoalType.PRODUCTIONS_COOKED]: 'Cocinar recetas',
  [GoalType.POSTS_PUBLISHED]: 'Publicar en redes',
  [GoalType.POPULARITY]: 'Popularidad',
  [GoalType.INFORMAL_ORDERS]: 'Pedidos informales',
  [GoalType.CUSTOMERS_REGISTERED]: 'Registrar clientes',
  [GoalType.ORDERS_CREATED]: 'Crear pedidos',
  [GoalType.SALES_COMPLETED]: 'Completar ventas',
};
