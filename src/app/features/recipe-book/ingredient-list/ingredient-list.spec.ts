import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { FormArray, FormGroup } from '@angular/forms';
import { makeIngredient, makeRecipeBookFakes } from '@core/recipe-book/testing/recipe-book-test-doubles';
import { IngredientRepository } from '@core/recipe-book/domain/repositories/ingredient.repository';
import { EntityId } from '@core/_common/entity-id';
import { Quantity } from '@core/_common/quantity';
import { IngredientList } from './ingredient-list';

interface ListInternals {
  lines: FormArray;
  errorMessage: () => string;
  trySaveRow(index: number): Promise<void>;
}

describe('IngredientList', () => {
  let repo: IngredientRepository;

  async function render(
    seed: ReturnType<typeof makeIngredient>[] = [],
  ): Promise<{ fixture: ComponentFixture<IngredientList>; internals: ListInternals }> {
    TestBed.configureTestingModule({
      imports: [IngredientList],
      providers: makeRecipeBookFakes().providers,
    });
    repo = TestBed.inject(IngredientRepository);
    for (const ingredient of seed) {
      await repo.save(ingredient);
    }
    const fixture = TestBed.createComponent(IngredientList);
    fixture.componentRef.setInput('ingredients', seed);
    fixture.detectChanges();
    return { fixture, internals: fixture.componentInstance as unknown as ListInternals };
  }

  function setRow(internals: ListInternals, i: number, values: Partial<Record<'name' | 'packaging' | 'unit' | 'price', string>>): void {
    const row = internals.lines.at(i) as FormGroup;
    for (const [key, value] of Object.entries(values)) {
      row.get(key)!.setValue(value);
    }
  }

  it('seeds one editable row per existing ingredient plus a trailing blank row', async () => {
    const { internals } = await render([makeIngredient('IN-1', 'Harina', { amount: 5, per: Quantity.of(1000, 'g') })]);
    expect(internals.lines.length).toBe(2); // Harina + blank
    expect(internals.lines.at(0).get('name')!.value).toBe('Harina');
    expect(internals.lines.at(0).get('packaging')!.value).toBe('1'); // 1000 g shown as 1 kg
    expect(internals.lines.at(0).get('price')!.value).toBe('5');
  });

  it('seeds the rows in alphabetical order', async () => {
    const { internals } = await render([
      makeIngredient('IN-1', 'Zanahoria'),
      makeIngredient('IN-2', 'Azúcar'),
      makeIngredient('IN-3', 'harina'),
    ]);
    const names = internals.lines.controls.slice(0, 3).map((r) => r.get('name')!.value);
    expect(names).toEqual(['Azúcar', 'harina', 'Zanahoria']);
  });

  it('writes a new ingredient from the trailing row (create) and adds a fresh blank row', async () => {
    const { internals } = await render([]);
    setRow(internals, 0, { name: 'Mantequilla', packaging: '1', unit: 'k', price: '20' });

    await internals.trySaveRow(0);

    const all = await repo.all();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Mantequilla');
    expect(all[0].baseUnit).toBe('g');
    expect(all[0].purchasePrice.amount).toBe(20);
    expect(all[0].purchasePrice.per).toEqual(Quantity.of(1000, 'g'));
    expect(internals.lines.at(0).get('id')!.value).toBe(all[0].id.value); // row became existing
    expect(internals.lines.length).toBe(2); // new trailing blank
  });

  it('edits the price of an existing ingredient in place (no duplicate)', async () => {
    const { internals } = await render([makeIngredient('IN-1', 'Harina', { amount: 5, per: Quantity.of(1000, 'g') })]);
    setRow(internals, 0, { price: '8' });

    await internals.trySaveRow(0);

    expect(await repo.all()).toHaveLength(1);
    expect((await repo.byId(new EntityId('IN-1')))?.purchasePrice.amount).toBe(8);
  });

  it('renames an existing ingredient in place keeping its identity', async () => {
    const { internals } = await render([makeIngredient('IN-1', 'Harina', { amount: 5, per: Quantity.of(1000, 'g') })]);
    setRow(internals, 0, { name: 'Harina sin gluten' });

    await internals.trySaveRow(0);

    expect(await repo.all()).toHaveLength(1);
    expect((await repo.byId(new EntityId('IN-1')))?.name).toBe('Harina sin gluten');
  });

  it('shows an error and keeps the original name when renaming collides with another insumo', async () => {
    const { internals } = await render([
      makeIngredient('IN-1', 'Harina', { amount: 5, per: Quantity.of(1000, 'g') }),
      makeIngredient('IN-2', 'Azúcar', { amount: 4, per: Quantity.of(1000, 'g') }),
    ]);
    // Ordenadas: fila 0 = Azúcar (IN-2), fila 1 = Harina (IN-1). Renombrar Azúcar → Harina colisiona.
    setRow(internals, 0, { name: 'Harina' });

    await internals.trySaveRow(0);

    expect(internals.errorMessage()).toContain('Ya existe un insumo');
    expect((await repo.byId(new EntityId('IN-2')))?.name).toBe('Azúcar');
  });

  it('does not persist an incomplete trailing row', async () => {
    const { internals } = await render([]);
    setRow(internals, 0, { name: 'Solo nombre' }); // sin empaque ni precio

    await internals.trySaveRow(0);

    expect(await repo.all()).toHaveLength(0);
  });

  it('saves the row that lost focus on focusout', async () => {
    const { fixture, internals } = await render([
      makeIngredient('IN-1', 'Harina', { amount: 5, per: Quantity.of(1000, 'g') }),
    ]);
    setRow(internals, 0, { price: '9' });

    const cell = fixture.nativeElement.querySelector('[role="gridcell"][data-row="0"]') as HTMLElement;
    cell.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    await new Promise<void>((resolve) => setTimeout(resolve));

    expect((await repo.byId(new EntityId('IN-1')))?.purchasePrice.amount).toBe(9);
  });
});
