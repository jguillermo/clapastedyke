import { TestBed } from '@angular/core/testing';
import { EntityId } from '@core/_common/entity-id';
import { Quantity } from '@core/_common/quantity';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import {
  makeConvertibleCategory,
  makeConvertibleRecipe,
  makeIngredient,
  makeRecipeBookFakes,
} from '@core/recipe-book/testing/recipe-book-test-doubles';
import { ConversionOption } from '@core/recipe-book/domain/entities/conversion-option';
import { IngredientLine } from '@core/recipe-book/domain/value-objects/ingredient-line';
import { RecipeRepository } from '@core/recipe-book/domain/repositories/recipe.repository';
import { RecipeCategoryRepository } from '@core/recipe-book/domain/repositories/recipe-category.repository';
import { ConversionOptionRepository } from '@core/recipe-book/domain/repositories/conversion-option.repository';
import { IngredientRepository } from '@core/recipe-book/domain/repositories/ingredient.repository';
import { RecipeSelectionRepository } from '@core/recipe-book/domain/repositories/recipe-selection.repository';
import { RecipeSelection, type RecipeSelectionData } from './recipe-selection';

const data: RecipeSelectionData = {
  recipeId: 're',
  recipeName: 'Bizcocho',
  fields: [
    {
      propertyId: 'porciones',
      label: 'Porciones',
      kind: 'options',
      group: 'portions',
      suggestions: ['Normal', 'Doble'],
      options: [
        { id: 'co-portions-normal', label: 'Normal', factor: 1 },
        { id: 'co-portions-double', label: 'Doble', factor: 2 },
      ],
    },
  ],
};

/** Espera a que se resuelva la previsualización asíncrona (ConvertRecipe). */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('RecipeSelection (dialog)', () => {
  let closeSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    closeSpy = vi.fn();
    TestBed.configureTestingModule({
      imports: [RecipeSelection],
      providers: [
        ...makeRecipeBookFakes().providers,
        { provide: MIGO_DIALOG_DATA, useValue: data },
        { provide: MigoDialogRef, useValue: { close: closeSpy } },
      ],
    });
    await TestBed.inject(RecipeCategoryRepository).save(makeConvertibleCategory('cat'));
    await TestBed.inject(IngredientRepository).save(
      makeIngredient('in', 'Harina', { amount: 5, per: Quantity.of(1000, 'g') }),
    );
    await TestBed.inject(RecipeRepository).save(
      makeConvertibleRecipe('re', 'cat', 'Bizcocho', [
        IngredientLine.of(new EntityId('in'), Quantity.of(500, 'g')),
      ]),
    );
    await TestBed.inject(ConversionOptionRepository).save(
      ConversionOption.create(new EntityId('co-portions-normal'), 'portions', 'Normal', 1),
    );
    await TestBed.inject(ConversionOptionRepository).save(
      ConversionOption.create(new EntityId('co-portions-double'), 'portions', 'Doble', 2),
    );
  });

  it('choosing Doble previews factor ×2 and scaled lines', async () => {
    const fixture = TestBed.createComponent(RecipeSelection);
    fixture.detectChanges();
    const form = (fixture.componentInstance as unknown as { form: { get(k: string): { setValue(v: string): void } } }).form;
    form.get('porciones')!.setValue('Doble');
    await flush();

    const preview = (fixture.componentInstance as unknown as { preview(): { factor: number; lines: { quantity: { value: number } }[] } | null }).preview();
    expect(preview?.factor).toBe(2);
    expect(preview?.lines[0].quantity.value).toBe(1000);
  });

  it('choose Doble → save → persists selection by option id → dialog closes', async () => {
    const fixture = TestBed.createComponent(RecipeSelection);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as {
      form: { get(k: string): { setValue(v: string): void } };
      save(): Promise<void>;
    };
    component.form.get('porciones')!.setValue('Doble');
    await flush();
    await component.save();

    const selections = await TestBed.inject(RecipeSelectionRepository).byRecipe(new EntityId('re'));
    expect(selections).toHaveLength(1);
    expect(selections[0].portionsOptionId?.value).toBe('co-portions-double');
    expect(closeSpy).toHaveBeenCalledWith({ id: selections[0].id.value });
  });
});
