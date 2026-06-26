import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import {
  makeConvertibleCategory,
  makeConvertibleRecipe,
  makeIngredient,
  makeRecipeBookFakes,
} from '../../recipe-book-test-doubles';
import { ConversionOption } from '../../../domain/entities/conversion-option';
import { IngredientLine } from '../../../domain/value-objects/ingredient-line';
import { RecipeRepository } from '../../../domain/repositories/recipe.repository';
import { RecipeCategoryRepository } from '../../../domain/repositories/recipe-category.repository';
import { ConversionOptionRepository } from '../../../domain/repositories/conversion-option.repository';
import { IngredientRepository } from '../../../domain/repositories/ingredient.repository';
import { ConvertRecipe } from '../../../application/use-cases/convert-recipe.use-case';

describe('ConvertRecipe', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
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
      ConversionOption.create(new EntityId('co-portions-double'), 'portions', 'Doble', 2),
    );
    await TestBed.inject(ConversionOptionRepository).save(
      ConversionOption.create(new EntityId('co-mold-half'), 'mold', 'Molde pequeño', 0.5),
    );
  });

  it('scales lines and costs by the chosen portions factor', async () => {
    const result = await TestBed.inject(ConvertRecipe).execute({
      recipeId: 're',
      portionsOptionId: 'co-portions-double',
    });

    expect(result.factor).toBe(2);
    expect(result.optionLabels).toContain('Doble');
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].name).toBe('Harina');
    expect(result.lines[0].quantity.value).toBe(1000); // 500 g × 2
    expect(result.lines[0].cost).not.toBe('');
    expect(result.total).toContain('S/');
  });

  it('multiplies factors when portions and mold are both chosen', async () => {
    const result = await TestBed.inject(ConvertRecipe).execute({
      recipeId: 're',
      portionsOptionId: 'co-portions-double',
      moldOptionId: 'co-mold-half',
    });
    expect(result.factor).toBe(1); // 2 × 0.5
    expect(result.lines[0].quantity.value).toBe(500);
  });
});
