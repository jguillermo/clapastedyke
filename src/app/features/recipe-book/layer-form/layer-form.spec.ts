import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { FormArray, FormGroup } from '@angular/forms';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import { SaveIngredient } from '@core/recipe-book/application/use-cases/save-ingredient.use-case';
import { SaveFillingRecipe } from '@core/recipe-book/application/use-cases/save-filling-recipe.use-case';
import { SaveCoveringRecipe } from '@core/recipe-book/application/use-cases/save-covering-recipe.use-case';
import { IngredientGrid } from '../_shared/ingredient-grid/ingredient-grid';
import { LayerForm, type LayerFormData, type LayerKind } from './layer-form';

interface LayerRequest {
  name: string;
  referenceWeightGrams: number;
  lines: { ingredientId: string; quantity: number }[];
}

class SaveLayerStub {
  readonly calls: LayerRequest[] = [];
  constructor(private readonly id: string) {}
  async execute(request: LayerRequest): Promise<{ id: string }> {
    this.calls.push(request);
    return { id: this.id };
  }
}

class SaveIngredientStub {
  readonly calls: { name: string; baseUnit: string; usage: string }[] = [];
  async execute(request: { name: string; baseUnit: string; usage: string }): Promise<{ id: string }> {
    this.calls.push(request);
    return { id: `ing-${request.name}` };
  }
}

type PurchaseLite = { amount: number; per: { value: number; unit: 'g' | 'u' } };

interface GridInternals {
  lines: FormArray;
}

interface LayerFormInternals {
  form: FormGroup;
  onChars(selection: Record<string, string>): void;
  save(): Promise<void>;
}

describe('LayerForm', () => {
  let filling: SaveLayerStub;
  let covering: SaveLayerStub;
  let ingredient: SaveIngredientStub;

  function setup(kind: LayerKind) {
    filling = new SaveLayerStub('filling-1');
    covering = new SaveLayerStub('covering-1');
    ingredient = new SaveIngredientStub();
    const data: LayerFormData = { kind, ingredients: [], usedWeights: [] };
    TestBed.configureTestingModule({
      imports: [LayerForm],
      providers: [
        { provide: SaveFillingRecipe, useValue: filling },
        { provide: SaveCoveringRecipe, useValue: covering },
        { provide: SaveIngredient, useValue: ingredient },
        { provide: MigoDialogRef, useValue: { close: () => {} } },
        { provide: MIGO_DIALOG_DATA, useValue: data },
      ],
    });
    const fixture = TestBed.createComponent(LayerForm);
    fixture.detectChanges();
    const internals = fixture.componentInstance as unknown as LayerFormInternals;
    const grid = fixture.debugElement.query(By.directive(IngredientGrid)).componentInstance as unknown as GridInternals;
    return { internals, grid };
  }

  function fillLine(
    grid: GridInternals,
    name: string,
    quantity: string,
    purchase: PurchaseLite = { amount: 5, per: { value: 1000, unit: 'g' } },
  ) {
    grid.lines.at(0).get('name')!.setValue(name);
    grid.lines.at(0).get('quantity')!.setValue(quantity);
    grid.lines.at(0).get('purchase')!.setValue(purchase);
  }

  it('relleno → guarda con el peso de referencia y las líneas', async () => {
    const { internals, grid } = setup('filling');
    internals.form.get('name')!.setValue('Manjar blanco');
    fillLine(grid, 'Manjar', '300');
    internals.onChars({ peso: '1 kg' });

    await internals.save();

    expect(ingredient.calls[0]).toMatchObject({ name: 'Manjar', baseUnit: 'g', usage: 'recipe' });
    expect(filling.calls).toHaveLength(1);
    expect(filling.calls[0]).toEqual({
      name: 'Manjar blanco',
      referenceWeightGrams: 1000,
      lines: [{ ingredientId: 'ing-Manjar', quantity: 300 }],
    });
    expect(covering.calls).toHaveLength(0);
  });

  it('cobertura → guarda en el caso de uso de cobertura', async () => {
    const { internals, grid } = setup('covering');
    internals.form.get('name')!.setValue('Chantilly');
    fillLine(grid, 'Crema', '200');
    internals.onChars({ peso: '1 kg' });

    await internals.save();

    expect(covering.calls).toHaveLength(1);
    expect(covering.calls[0]).toEqual({
      name: 'Chantilly',
      referenceWeightGrams: 1000,
      lines: [{ ingredientId: 'ing-Crema', quantity: 200 }],
    });
    expect(filling.calls).toHaveLength(0);
  });

  it('no guarda sin el peso de referencia', async () => {
    const { internals, grid } = setup('filling');
    internals.form.get('name')!.setValue('Manjar blanco');
    fillLine(grid, 'Manjar', '300');
    // sin etiqueta de peso
    await internals.save();
    expect(filling.calls).toHaveLength(0);
  });

  it('no guarda sin nombre ni líneas', async () => {
    const { internals } = setup('filling');
    internals.onChars({ peso: '1 kg' });
    await internals.save();
    expect(filling.calls).toHaveLength(0);
    expect(ingredient.calls).toHaveLength(0);
  });
});
