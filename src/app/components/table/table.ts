import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  ElementRef,
  inject,
  input,
  output,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/** Tamaño de columna: `number` = px; `'40%'` = porcentaje; `'fit'` = ajustado al contenido; omitido = flexible. */
export type TableSize = number | `${number}%` | 'fit';
export type TableAlign = 'start' | 'center' | 'end';

/** Definición de columna de la tabla. */
export interface TableColumn {
  name: string;
  /** Ancho de la columna. Omitido → flexible (ocupa lo que sobra). Ver {@link TableSize}. */
  size?: TableSize;
  /** Alineación del contenido de la columna. Por defecto `'start'`. */
  align?: TableAlign;
  /** Tope opcional de ancho (px o `%`). */
  max?: number | `${number}%`;
}

/** Contexto que recibe la plantilla de celda del consumidor. */
export interface TableCellContext {
  $implicit: unknown;
  rowIndex: number;
  col: TableColumn;
  colIndex: number;
}

/**
 * px → utilidad de ancho del tema (escala 4px). LITERALES: Tailwind solo genera las clases que
 * aparecen tal cual en el código, así que no se pueden construir en runtime (`w-${n}`).
 * Se emite `w-* min-w-* max-w-*`: en `table-auto` el `width` es solo una sugerencia (la columna se
 * encoge al contenido), así que `min-w`+`max-w` la fijan EXACTA (la regla "si paso un tamaño, fija").
 */
const PX_W: Record<number, string> = {
  0: 'w-0 min-w-0 max-w-0',
  24: 'w-6 min-w-6 max-w-6',
  32: 'w-8 min-w-8 max-w-8',
  40: 'w-10 min-w-10 max-w-10',
  44: 'w-11 min-w-11 max-w-11',
  48: 'w-12 min-w-12 max-w-12',
  56: 'w-14 min-w-14 max-w-14',
  64: 'w-16 min-w-16 max-w-16',
  80: 'w-20 min-w-20 max-w-20',
  96: 'w-24 min-w-24 max-w-24',
  112: 'w-28 min-w-28 max-w-28',
  128: 'w-32 min-w-32 max-w-32',
  144: 'w-36 min-w-36 max-w-36',
  160: 'w-40 min-w-40 max-w-40',
  192: 'w-48 min-w-48 max-w-48',
  224: 'w-56 min-w-56 max-w-56',
  256: 'w-64 min-w-64 max-w-64',
};
/** % → fracción del tema (literales). El % de tabla lo respeta `table-auto` razonablemente. */
const PCT_W: Record<number, string> = {
  25: 'w-1/4',
  33: 'w-1/3',
  40: 'w-2/5',
  50: 'w-1/2',
  60: 'w-3/5',
  66: 'w-2/3',
  75: 'w-3/4',
  80: 'w-4/5',
};
/** px → tope de ancho del tema (literales). */
const PX_MAX: Record<number, string> = {
  96: 'max-w-24',
  128: 'max-w-32',
  160: 'max-w-40',
  224: 'max-w-56',
  320: 'max-w-80',
  384: 'max-w-96',
};
/** % → tope de ancho por fracción (literales). */
const PCT_MAX: Record<number, string> = {
  25: 'max-w-1/4',
  33: 'max-w-1/3',
  40: 'max-w-2/5',
  50: 'max-w-1/2',
  60: 'max-w-3/5',
  66: 'max-w-2/3',
  75: 'max-w-3/4',
  80: 'max-w-4/5',
};

const ALIGN: Record<TableAlign, string> = {
  start: 'text-start',
  center: 'text-center',
  end: 'text-end',
};

/**
 * Shell de **hoja de cálculo** sobre un `<table>` real (`role="grid"`): cabecera por columna,
 * celdas pegadas y navegación por teclado entre celdas. Presentacional y **agnóstico del editor**:
 * el consumidor proyecta una `<ng-template>` que pinta el control de cada celda (típicamente
 * `migo-combobox`/`migo-unit-input` `seamless`). Los datos y la lógica (fila vacía, validación)
 * viven en el feature.
 *
 * **Eliminar fila**: la tabla NO trae columna de acciones propia. Si el feature necesita borrar,
 * añade su columna con un botón y llama a {@link remove} (vía referencia de plantilla, p.ej.
 * `#t` → `t.remove(rowIndex)`), que dispara la salida {@link removeRow}.
 *
 * **Tamaños por columna** ({@link TableColumn.size}): `'fit'` y la pista compartida los da
 * `table-auto` nativamente; px/`%`/flexible se expresan con **utilidades del tema** (mapas
 * literales `PX_W`/`PCT_W`), sin valores arbitrarios ni `[style]` inline. Los inputs de las celdas
 * llevan `min-w-0` (variante `[&_input]:`) para que `table-auto` respete los anchos fijos.
 *
 * Teclado (modelo "grilla de inputs"): ↑/↓ cambian de fila; Enter baja; ←/→ mueven el cursor y, en
 * el borde del input, saltan de celda; **Tab usa el orden nativo** (fila-mayor: celda→celda y, al
 * final de la fila, a la primera de la siguiente). El `<table>` no reordena el DOM, así que el Tab
 * es idéntico al de la maqueta anterior.
 */
@Component({
  selector: 'migo-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    <table role="grid" [attr.aria-label]="ariaLabel() || null" [class]="tableClasses()">
      <thead>
        <tr role="row">
          @for (col of columns(); track col.name; let lastCol = $last) {
            <th role="columnheader" scope="col" [class]="headClasses(col, lastCol)">
              {{ col.name }}
            </th>
          }
        </tr>
      </thead>

      @if (cell(); as cellTemplate) {
        <tbody>
          @for (row of rows(); track $index; let r = $index, lastRow = $last) {
            <tr role="row">
              @for (col of columns(); track col.name; let c = $index, lastCol = $last) {
                <td
                  role="gridcell"
                  [attr.data-row]="r"
                  [attr.data-col]="c"
                  [class]="cellClasses(col, lastCol, lastRow)"
                >
                  <ng-container
                    [ngTemplateOutlet]="cellTemplate"
                    [ngTemplateOutletContext]="{ $implicit: row, rowIndex: r, col: col, colIndex: c }"
                  />
                </td>
              }
            </tr>
          }
        </tbody>
      }
    </table>
  `,
  host: {
    // Contenedor de scroll horizontal (fallback si las columnas fijas/% superan el ancho); sin alto
    // máximo ⇒ nunca scroll vertical (crece y scrollea el contenedor exterior). Ver mobile-first.
    '[class]': 'hostClasses()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class Table {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly columns = input<readonly TableColumn[]>([]);
  readonly rows = input<readonly unknown[]>([]);
  readonly ariaLabel = input('');
  /** En móvil (<640px) rompe el padding del padre y ocupa todo el ancho (borde a borde). */
  readonly bleed = input(false, { transform: booleanAttribute });
  /** Tope de ancho de la tabla (centrada en `sm+`). */
  readonly maxWidth = input<'reading' | 'page' | null>(null);

  /** Plantilla de celda proyectada por el consumidor. */
  protected readonly cell = contentChild(TemplateRef<TableCellContext>);

  /**
   * Eliminar fila. La tabla NO pinta el botón: el consumidor renderiza el suyo en una columna y
   * llama a {@link remove} (vía referencia de plantilla) para disparar este evento.
   */
  readonly removeRow = output<number>();

  /** API para que el botón de eliminar del consumidor dispare {@link removeRow}. */
  remove(index: number): void {
    this.removeRow.emit(index);
  }

  // El host solo gestiona el scroll horizontal de fallback y el ancho/bleed; el borde y el redondeo
  // viven en la `<table>` (ver `tableClasses`).
  protected readonly hostClasses = computed(() => {
    const parts = ['block overflow-x-auto'];
    const mw = this.maxWidth();
    if (this.bleed()) {
      parts.push('-mx-4');
      if (mw === null) parts.push('sm:mx-0');
    }
    if (mw === 'reading') parts.push('max-w-reading sm:mx-auto');
    else if (mw === 'page') parts.push('max-w-page sm:mx-auto');
    return parts.join(' ');
  });

  // La tabla lleva el borde y el `rounded-md`: con `border-separate` el `border-radius` SÍ se
  // respeta (a diferencia de `border-collapse`), y `overflow-hidden` recorta el fondo de las celdas
  // (p.ej. el cream de la cabecera) a las esquinas redondeadas. En móvil con `bleed` pierde el radio.
  protected readonly tableClasses = computed(() => {
    const rounded = this.bleed() ? 'rounded-none sm:rounded-md' : 'rounded-md';
    return `w-full table-auto border-separate border-spacing-0 border border-border-subtle overflow-hidden ${rounded}`;
  });

  /** Clase de la celda de cabecera. Solo bordes INTERNOS (la `<table>` pinta el perímetro). */
  protected headClasses(col: TableColumn, lastCol: boolean): string {
    const r = lastCol ? '' : 'border-r';
    return `${this.colWidth(col)} ${this.colMax(col)} ${this.colAlign(col)} bg-surface-sunken px-3 py-2 border-b ${r} border-border-subtle font-body text-caption font-semibold text-muted`;
  }

  /** Clase de la celda de cuerpo. Bordes internos: `border-r` salvo última columna, `border-b` salvo última fila. */
  protected cellClasses(col: TableColumn, lastCol: boolean, lastRow: boolean): string {
    const r = lastCol ? '' : 'border-r';
    const bb = lastRow ? '' : 'border-b';
    return `${this.colWidth(col)} ${this.colMax(col)} ${this.colAlign(col)} ${bb} ${r} border-border-subtle align-middle [&_input]:min-w-0`;
  }

  protected colWidth(col: TableColumn): string {
    const size = col.size;
    // Flexible: columna `auto` (sin width). En `table-auto` con la tabla a `w-full` absorbe el
    // sobrante. OJO: `w-full` (width:100%) en una celda de tabla desborda (100% + las demás), por
    // eso NO se usa.
    if (size === undefined) return '';
    // Ajustado: encoge al contenido. `w-px` no reclama espacio extra y `whitespace-nowrap` evita
    // que el contenido se parta (si no, la columna flexible la aplasta a su min-content).
    if (size === 'fit') return 'w-px whitespace-nowrap';
    if (typeof size === 'number') return nearest(PX_W, size);
    return nearest(PCT_W, parsePercent(size));
  }

  protected colMax(col: TableColumn): string {
    const max = col.max;
    if (max === undefined) return '';
    if (typeof max === 'number') return nearest(PX_MAX, max);
    return nearest(PCT_MAX, parsePercent(max));
  }

  protected colAlign(col: TableColumn): string {
    return ALIGN[col.align ?? 'start'];
  }

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

/** Parsea `'40%'` → 40. */
function parsePercent(value: `${number}%`): number {
  return Number(value.slice(0, -1));
}

/** Devuelve la utilidad del valor más cercano del mapa (los tamaños se ajustan a la escala del tema). */
function nearest(map: Record<number, string>, value: number): string {
  const keys = Object.keys(map).map(Number);
  let best = keys[0];
  for (const k of keys) {
    if (Math.abs(k - value) < Math.abs(best - value)) best = k;
  }
  return map[best];
}

function caretAtEnd(el: HTMLElement | null): boolean {
  return el instanceof HTMLInputElement ? el.selectionStart === el.value.length : true;
}

function caretAtStart(el: HTMLElement | null): boolean {
  return el instanceof HTMLInputElement ? el.selectionEnd === 0 : true;
}
