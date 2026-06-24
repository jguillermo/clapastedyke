import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  contentChild,
  ElementRef,
  inject,
  input,
  output,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Button } from '@components/button/button';
import { Icon } from '@components/icon/icon';

/** Definición de columna de la grilla. */
export interface GridColumn {
  label: string;
  /** Utilidad de ancho del tema (p.ej. `w-40`). Por defecto la celda crece (`flex-1`). */
  width?: string;
}

/** Contexto que recibe la plantilla de celda del consumidor. */
export interface GridCellContext {
  $implicit: unknown;
  rowIndex: number;
  col: GridColumn;
  colIndex: number;
}

/**
 * Shell de **hoja de cálculo**: cabecera por columna, celdas pegadas y navegación
 * por teclado entre celdas, más un botón de eliminar fila por fila. Presentacional
 * y **agnóstico del editor**: el consumidor proyecta una `<ng-template>` que pinta
 * el control de cada celda (típicamente `migo-autocomplete`/`migo-unit-input`
 * `seamless`). Los datos y la lógica (fila vacía, validación) viven en el feature.
 *
 * Teclado (modelo "grilla de inputs"): ↑/↓ cambian de fila; Enter baja; ←/→ mueven
 * el cursor y, en el borde del input, saltan de celda; Tab usa el orden nativo.
 */
@Component({
  selector: 'migo-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, Button, Icon],
  template: `
    <div role="row" class="flex bg-surface-sunken">
      @for (col of columns(); track col.label) {
        <div
          role="columnheader"
          class="{{ col.width ? col.width + ' shrink-0' : 'flex-1 min-w-32' }} px-3 py-2 border-b border-r border-border-subtle font-body text-caption font-semibold text-muted"
        >
          {{ col.label }}
        </div>
      }
      @if (removable()) {
        <div role="columnheader" class="w-12 shrink-0 px-2 py-2 border-b border-r border-border-subtle">
          <span class="sr-only">Acciones</span>
        </div>
      }
    </div>

    @if (cell(); as cellTemplate) {
      @for (row of rows(); track $index; let r = $index) {
        <div role="row" class="flex">
          @for (col of columns(); track col.label; let c = $index) {
            <div
              role="gridcell"
              [attr.data-row]="r"
              [attr.data-col]="c"
              class="{{ col.width ? col.width + ' shrink-0' : 'flex-1 min-w-32' }} border-b border-r border-border-subtle"
            >
              <ng-container
                [ngTemplateOutlet]="cellTemplate"
                [ngTemplateOutletContext]="{ $implicit: row, rowIndex: r, col: col, colIndex: c }"
              />
            </div>
          }
          @if (removable()) {
            <div role="gridcell" class="w-12 shrink-0 flex items-center justify-center border-b border-r border-border-subtle">
              @if (!protectLastRow() || r < rows().length - 1) {
                <button
                  migo-button
                  variant="ghost"
                  size="sm"
                  type="button"
                  aria-label="Quitar fila"
                  (click)="removeRow.emit(r)"
                >
                  <migo-icon icon-leading name="mat:close" size="sm" />
                </button>
              }
            </div>
          }
        </div>
      }
    }
  `,
  host: {
    role: 'grid',
    // Mobile-first: scroll horizontal en pantallas estrechas (las columnas conservan ancho con
    // `shrink-0` / `min-w-32` y no se aplastan). El contenedor clipa con su radio.
    // Ver mobile-first-conventions.md.
    class: 'block overflow-x-auto rounded-md border-t border-l border-border-subtle',
    '[attr.aria-label]': 'ariaLabel() || null',
    '(keydown)': 'onKeydown($event)',
  },
})
export class Grid {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly columns = input<readonly GridColumn[]>([]);
  readonly rows = input<readonly unknown[]>([]);
  readonly ariaLabel = input('');
  /** Desactiva eliminar en la última fila (la vacía siempre disponible). */
  readonly protectLastRow = input(true);
  /** Muestra la columna de acciones (eliminar fila). `false` la oculta por completo. */
  readonly removable = input(true, { transform: booleanAttribute });

  /** Plantilla de celda proyectada por el consumidor. */
  protected readonly cell = contentChild(TemplateRef<GridCellContext>);

  readonly removeRow = output<number>();

  protected onKeydown(event: KeyboardEvent): void {
    const active = document.activeElement as HTMLElement | null;
    const cell = active?.closest<HTMLElement>('[role="gridcell"]') ?? null;
    if (!cell || !this.host.nativeElement.contains(cell) || cell.dataset['row'] === undefined) {
      return;
    }
    const r = Number(cell.dataset['row']);
    const c = Number(cell.dataset['col']);

    let target: { r: number; c: number } | null = null;
    switch (event.key) {
      case 'Enter':
        if (active?.tagName === 'BUTTON') return; // botones resuelven con comportamiento nativo
        target = { r: r + 1, c: 0 }; // al inicio de la fila siguiente
        break;
      case 'ArrowDown':
        target = { r: r + 1, c };
        break;
      case 'ArrowUp':
        target = { r: r - 1, c };
        break;
      case 'ArrowRight':
        if (caretAtEnd(active)) target = { r, c: c + 1 };
        break;
      case 'ArrowLeft':
        if (caretAtStart(active)) target = { r, c: c - 1 };
        break;
      default:
        return;
    }
    if (target && this.focusCell(target.r, target.c)) {
      event.preventDefault();
    }
  }

  focusCell(r: number, c: number): boolean {
    if (r < 0 || c < 0) {
      return false;
    }
    const cell = this.host.nativeElement.querySelector<HTMLElement>(
      `[role="gridcell"][data-row="${r}"][data-col="${c}"]`,
    );
    const focusable = cell?.querySelector<HTMLElement>('input, textarea, select, button, [tabindex]');
    if (!focusable) {
      return false;
    }
    focusable.focus();
    if (focusable instanceof HTMLInputElement) {
      const end = focusable.value.length;
      focusable.setSelectionRange(end, end);
    }
    return true;
  }
}

function caretAtEnd(el: HTMLElement | null): boolean {
  return el instanceof HTMLInputElement ? el.selectionStart === el.value.length : true;
}

function caretAtStart(el: HTMLElement | null): boolean {
  return el instanceof HTMLInputElement ? el.selectionEnd === 0 : true;
}
