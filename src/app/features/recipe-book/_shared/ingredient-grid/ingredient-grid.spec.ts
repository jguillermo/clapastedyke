import { TestBed } from '@angular/core/testing';
import type { FormArray } from '@angular/forms';
import { IngredientGrid, type ParsedLine } from './ingredient-grid';

type PurchaseLite = { amount: number; per: { value: number; unit: 'g' | 'u' } };

interface GridInternals {
  lines: FormArray;
  setLineUnit(index: number, token: 'k' | 'g' | 'u'): void;
  openPrice(index: number, origin: HTMLElement): void;
  activeKind(): 'mass' | 'count' | 'any';
  collect(): ParsedLine[] | null;
}

describe('IngredientGrid', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [IngredientGrid] });
    const fixture = TestBed.createComponent(IngredientGrid);
    fixture.detectChanges();
    const internals = fixture.componentInstance as unknown as GridInternals;
    return { fixture, internals };
  }

  function fillLine(
    internals: GridInternals,
    i: number,
    name: string,
    quantity: string,
    purchase: PurchaseLite = { amount: 5, per: { value: 1000, unit: 'g' } },
  ) {
    internals.lines.at(i).get('name')!.setValue(name);
    internals.lines.at(i).get('quantity')!.setValue(quantity);
    internals.lines.at(i).get('purchase')!.setValue(purchase);
  }

  it('keeps an empty trailing row available as the user fills lines', () => {
    const { internals } = setup();
    expect(internals.lines.length).toBe(1);
    fillLine(internals, 0, 'Harina', '250');
    expect(internals.lines.length).toBe(2);
  });

  it('fija la familia del precio en "count" cuando la cantidad está en unidades', () => {
    const { internals } = setup();
    internals.lines.at(0).get('name')!.setValue('Huevos');
    internals.lines.at(0).get('quantity')!.setValue('12');
    internals.setLineUnit(0, 'u');
    internals.openPrice(0, document.createElement('button'));
    expect(internals.activeKind()).toBe('count');
  });

  it('fija la familia del precio en "mass" cuando la cantidad es un peso', () => {
    const { internals } = setup();
    internals.lines.at(0).get('name')!.setValue('Harina');
    internals.lines.at(0).get('quantity')!.setValue('250');
    internals.openPrice(0, document.createElement('button'));
    expect(internals.activeKind()).toBe('mass');
  });

  it('deja la familia en "any" mientras no haya una cantidad válida', () => {
    const { internals } = setup();
    internals.lines.at(0).get('name')!.setValue('Harina');
    internals.openPrice(0, document.createElement('button'));
    expect(internals.activeKind()).toBe('any');
  });

  it('collect() devuelve las líneas válidas parseadas a su unidad base', () => {
    const { internals } = setup();
    fillLine(internals, 0, 'Harina', '250');
    const parsed = internals.collect();
    expect(parsed).toEqual([
      { name: 'Harina', baseUnit: 'g', quantity: 250, purchase: { amount: 5, per: { value: 1000, unit: 'g' } } },
    ]);
  });

  it('collect() devuelve null sin líneas llenadas', () => {
    const { internals } = setup();
    expect(internals.collect()).toBeNull();
  });

  it('collect() devuelve null cuando una línea no tiene precio', () => {
    const { internals } = setup();
    internals.lines.at(0).get('name')!.setValue('Harina');
    internals.lines.at(0).get('quantity')!.setValue('250');
    expect(internals.collect()).toBeNull();
  });
});
