import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Table, type TableColumn } from './table';

@Component({
  imports: [Table],
  template: `
    <migo-table
      #table
      [columns]="columns"
      [rows]="rows"
      [bleed]="bleed"
      [maxWidth]="maxWidth"
      (removeRow)="removed = $event"
    >
      <ng-template let-r="rowIndex" let-c="colIndex">
        @if (c < 2) {
          <input [attr.data-cell]="r + '-' + c" />
        } @else {
          <button [attr.data-del]="r" aria-label="Quitar fila" (click)="table.remove(r)">x</button>
        }
      </ng-template>
    </migo-table>
  `,
})
class Host {
  // 3ª columna = el botón de eliminar que pinta el consumidor (la tabla ya no trae columna propia).
  columns: TableColumn[] = [{ name: 'Ingrediente' }, { name: 'Cantidad' }, { name: '', size: 'fit' }];
  readonly rows = [0, 1, 2];
  bleed = false;
  maxWidth: 'reading' | 'page' | null = null;
  removed = -1;
}

describe('Table (spreadsheet shell)', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  /** Configura los inputs ANTES del primer detectChanges (los signal inputs los leen ahí). */
  function setupWith(patch: (h: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    patch(fixture.componentInstance);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function cellInput(el: HTMLElement, r: number, c: number) {
    return el.querySelector<HTMLInputElement>(`input[data-cell="${r}-${c}"]`)!;
  }

  it('renders a real <table role="grid"> with <th scope="col"> per column', () => {
    const { el } = setup();
    const table = el.querySelector('table')!;
    expect(table.getAttribute('role')).toBe('grid');
    const headers = [...el.querySelectorAll('th[role="columnheader"]')].map((h) => h.textContent?.trim());
    expect(headers).toContain('Ingrediente');
    expect(headers).toContain('Cantidad');
    expect(el.querySelector('th[role="columnheader"]')!.getAttribute('scope')).toBe('col');
    // Estructura tabular real
    expect(el.querySelector('thead tr[role="row"]')).toBeTruthy();
    expect(el.querySelectorAll('tbody tr[role="row"]').length).toBe(3);
    expect(el.querySelector('td[role="gridcell"]')).toBeTruthy();
  });

  it('moves focus down a row with ArrowDown (same column)', () => {
    const { el } = setup();
    const start = cellInput(el, 0, 1);
    start.focus();
    start.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(cellInput(el, 1, 1));
  });

  it('moves to the start of the next row with Enter (column 0)', () => {
    const { el } = setup();
    const start = cellInput(el, 0, 1);
    start.focus();
    start.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(cellInput(el, 1, 0));
  });

  it('remove(index) API emits removeRow when the consumer button calls it', () => {
    const { fixture, el } = setup();
    // La tabla NO pinta su propio botón: solo está el del consumidor (3ª columna).
    el.querySelector<HTMLButtonElement>('button[data-del="1"]')!.click();
    expect(fixture.componentInstance.removed).toBe(1);
  });

  it('maps size to theme width utilities (px → token, % → fraction, fit → nowrap, omitted → auto)', () => {
    const { el } = setupWith((h) => {
      h.columns = [
        { name: 'Flex' }, // omitido → flexible (auto, sin width)
        { name: 'Fija', size: 96 }, // px → w-24
        { name: 'Porc', size: '40%' }, // % → w-2/5
        { name: 'Ajustada', size: 'fit' }, // fit → w-px whitespace-nowrap
      ];
    });
    const ths = [...el.querySelectorAll('th[role="columnheader"]')];
    expect(ths[0].className).not.toContain('w-full'); // flexible: auto, no width:100% (desbordaría)
    expect(ths[1].className).toContain('w-24');
    expect(ths[2].className).toContain('w-2/5');
    expect(ths[3].className).toContain('whitespace-nowrap'); // ajustada: encoge al contenido sin partirse
  });

  it('applies per-column alignment', () => {
    const { el } = setupWith((h) => {
      h.columns = [{ name: 'A', align: 'end' }, { name: 'B', align: 'center' }];
    });
    const ths = [...el.querySelectorAll('th[role="columnheader"]')];
    expect(ths[0].className).toContain('text-end');
    expect(ths[1].className).toContain('text-center');
  });

  it('rounds the <table> (not the wrapper) and bleeds the host on mobile', () => {
    const plain = setup();
    // Por defecto: la tabla lleva el borde + rounded-md (border-separate respeta el radio).
    expect(plain.el.querySelector('table')!.className).toContain('rounded-md');
    expect(plain.el.querySelector('table')!.className).toContain('border-separate');

    const { el } = setupWith((h) => (h.bleed = true));
    expect(el.querySelector('migo-table')!.className).toContain('-mx-4'); // host bleeds
    expect(el.querySelector('table')!.className).toContain('rounded-none'); // tabla sin radio en móvil
    expect(el.querySelector('table')!.className).toContain('sm:rounded-md');
  });

  it('applies maxWidth host utilities', () => {
    const { el } = setupWith((h) => (h.maxWidth = 'reading'));
    const tableEl = el.querySelector('migo-table')!;
    expect(tableEl.className).toContain('max-w-reading');
    expect(tableEl.className).toContain('sm:mx-auto');
  });

  it('renders no built-in actions column (only the consumer columns)', () => {
    const { el } = setup();
    // 3 columnas declaradas por el consumidor; la tabla no añade ninguna.
    expect(el.querySelectorAll('thead th[role="columnheader"]').length).toBe(3);
  });
});
