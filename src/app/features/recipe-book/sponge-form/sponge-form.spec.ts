import { TestBed } from '@angular/core/testing';
import type { FormArray, FormGroup } from '@angular/forms';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import type { UnitToken } from '@components/unit-input/unit-input';
import { SaveSpongeRecipe } from '@core/recipe-book/application/use-cases/save-sponge-recipe.use-case';
import { SaveIngredient } from '@core/recipe-book/application/use-cases/save-ingredient.use-case';
import { SpongeForm } from './sponge-form';

interface SpongeRequest {
  name: string;
  flavor?: string;
  referenceYield: { weightGrams: number; servings?: number; size?: string };
  lines: { ingredientId: string; quantity: number }[];
}

class SaveSpongeRecipeStub {
  readonly calls: SpongeRequest[] = [];
  async execute(request: SpongeRequest): Promise<{ id: string }> {
    this.calls.push(request);
    return { id: 'sponge-1' };
  }
}

class SaveIngredientStub {
  readonly calls: { name: string; baseUnit: string }[] = [];
  async execute(request: { name: string; baseUnit: string }): Promise<{ id: string }> {
    this.calls.push(request);
    return { id: `ing-${request.name}` };
  }
}

interface SpongeFormInternals {
  form: FormGroup;
  lines: FormArray;
  setLineUnit(index: number, token: UnitToken): void;
  onChars(selection: Record<string, string>): void;
  save(): Promise<void>;
}

describe('SpongeForm', () => {
  let sponge: SaveSpongeRecipeStub;
  let ingredient: SaveIngredientStub;

  function setup() {
    sponge = new SaveSpongeRecipeStub();
    ingredient = new SaveIngredientStub();
    TestBed.configureTestingModule({
      imports: [SpongeForm],
      providers: [
        { provide: SaveSpongeRecipe, useValue: sponge },
        { provide: SaveIngredient, useValue: ingredient },
        { provide: MigoDialogRef, useValue: { close: () => {} } },
        { provide: MIGO_DIALOG_DATA, useValue: { ingredients: [], valuesByType: {} } },
      ],
    });
    const fixture = TestBed.createComponent(SpongeForm);
    fixture.detectChanges();
    const internals = fixture.componentInstance as unknown as SpongeFormInternals;
    return { fixture, internals };
  }

  function fillLine(internals: SpongeFormInternals, i: number, name: string, quantity: string) {
    internals.lines.at(i).get('name')!.setValue(name);
    internals.lines.at(i).get('quantity')!.setValue(quantity);
  }

  it('keeps an empty trailing row available as the user fills lines', () => {
    const { internals } = setup();
    expect(internals.lines.length).toBe(1);
    fillLine(internals, 0, 'Harina', '250');
    expect(internals.lines.length).toBe(2);
  });

  it('takes the weight (scaling) and servings from the chosen tags', async () => {
    const { internals } = setup();
    internals.form.get('name')!.setValue('Queque de vainilla');
    fillLine(internals, 0, 'Harina', '250');
    internals.onChars({ peso: '1 kg', porciones: '8', 'tamaño': 'Mediano' });

    await internals.save();

    expect(ingredient.calls).toEqual([{ name: 'Harina', baseUnit: 'g' }]);
    expect(sponge.calls).toHaveLength(1);
    expect(sponge.calls[0].referenceYield).toEqual({ weightGrams: 1000, servings: 8, size: 'Mediano' });
    expect(sponge.calls[0].lines).toEqual([{ ingredientId: 'ing-Harina', quantity: 250 }]);
  });

  it('infers a count ingredient when the unit token is "u" (quantity 6, baseUnit u)', async () => {
    const { internals } = setup();
    internals.form.get('name')!.setValue('Queque');
    fillLine(internals, 0, 'Huevos', '6');
    internals.setLineUnit(0, 'u');
    internals.onChars({ peso: '1 kg' });

    await internals.save();

    expect(ingredient.calls).toEqual([{ name: 'Huevos', baseUnit: 'u' }]);
    expect(sponge.calls[0].lines).toEqual([{ ingredientId: 'ing-Huevos', quantity: 6 }]);
  });

  it('does not save without a weight tag', async () => {
    const { internals } = setup();
    internals.form.get('name')!.setValue('Queque');
    fillLine(internals, 0, 'Harina', '250');
    // sin etiqueta de peso
    await internals.save();
    expect(sponge.calls).toHaveLength(0);
  });

  it('does not save without a name or an ingredient line', async () => {
    const { internals } = setup();
    internals.onChars({ peso: '1 kg' });
    await internals.save();
    expect(sponge.calls).toHaveLength(0);
    expect(ingredient.calls).toHaveLength(0);
  });
});
