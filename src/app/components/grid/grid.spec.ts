import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Grid, type GridColumn } from './grid';

@Component({
  imports: [Grid],
  template: `
    <migo-grid [columns]="columns" [rows]="rows" (removeRow)="removed = $event">
      <ng-template let-r="rowIndex" let-c="colIndex">
        <input [attr.data-cell]="r + '-' + c" />
      </ng-template>
    </migo-grid>
  `,
})
class Host {
  readonly columns: GridColumn[] = [{ label: 'Ingrediente' }, { label: 'Cantidad' }];
  readonly rows = [0, 1, 2];
  removed = -1;
}

describe('Grid (spreadsheet shell)', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function cellInput(el: HTMLElement, r: number, c: number) {
    return el.querySelector<HTMLInputElement>(`input[data-cell="${r}-${c}"]`)!;
  }

  it('renders a header per column', () => {
    const { el } = setup();
    const headers = [...el.querySelectorAll('[role="columnheader"]')].map((h) => h.textContent?.trim());
    expect(headers).toContain('Ingrediente');
    expect(headers).toContain('Cantidad');
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

  it('emits removeRow with the row index when its delete button is clicked', () => {
    const { fixture, el } = setup();
    const firstDelete = el.querySelector<HTMLButtonElement>('button[aria-label="Quitar fila"]')!;
    firstDelete.click();
    expect(fixture.componentInstance.removed).toBe(0);
  });

  it('protects the last row from deletion by default', () => {
    const { el } = setup();
    const deleteButtons = el.querySelectorAll('button[aria-label="Quitar fila"]');
    // 3 filas, la última no tiene botón de eliminar.
    expect(deleteButtons.length).toBe(2);
  });
});

@Component({
  imports: [Grid],
  template: `
    <migo-grid [columns]="columns" [rows]="rows" [removable]="false">
      <ng-template let-r="rowIndex" let-c="colIndex">
        <input [attr.data-cell]="r + '-' + c" />
      </ng-template>
    </migo-grid>
  `,
})
class HostNoRemove {
  readonly columns: GridColumn[] = [{ label: 'Ingrediente' }, { label: 'Cantidad' }];
  readonly rows = [0, 1, 2];
}

describe('Grid · removable=false', () => {
  it('hides the actions column entirely', () => {
    const fixture = TestBed.createComponent(HostNoRemove);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('button[aria-label="Quitar fila"]').length).toBe(0);
    // Solo las dos columnas de datos, sin la cabecera de acciones.
    expect(el.querySelectorAll('[role="columnheader"]').length).toBe(2);
  });
});
