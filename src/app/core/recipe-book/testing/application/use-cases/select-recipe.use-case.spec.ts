import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { EventBus } from '../../../../_common/event-bus';
import {
  makeConvertibleCategory,
  makeConvertibleRecipe,
  makeRecipeBookFakes,
  RecordingEventBus,
} from '../../recipe-book-test-doubles';
import { ConversionOption } from '../../../domain/entities/conversion-option';
import { IngredientLine } from '../../../domain/value-objects/ingredient-line';
import { RecipeRepository } from '../../../domain/repositories/recipe.repository';
import { RecipeCategoryRepository } from '../../../domain/repositories/recipe-category.repository';
import { ConversionOptionRepository } from '../../../domain/repositories/conversion-option.repository';
import { RecipeSelectionRepository } from '../../../domain/repositories/recipe-selection.repository';
import { SelectRecipe } from '../../../application/use-cases/select-recipe.use-case';

describe('SelectRecipe', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
    await TestBed.inject(RecipeCategoryRepository).save(makeConvertibleCategory('cat'));
    await TestBed.inject(RecipeRepository).save(
      makeConvertibleRecipe('re', 'cat', 'Bizcocho', [
        IngredientLine.of(new EntityId('in'), Quantity.of(500, 'g')),
      ]),
    );
    await TestBed.inject(ConversionOptionRepository).save(
      ConversionOption.create(new EntityId('co-portions-double'), 'portions', 'Doble', 2),
    );
    await TestBed.inject(ConversionOptionRepository).save(
      ConversionOption.create(new EntityId('co-mold-large'), 'mold', 'Molde grande', 2),
    );
  });

  it('persists the selection by option id (flavor + portions + mold)', async () => {
    const { id } = await TestBed.inject(SelectRecipe).execute({
      recipeId: 're',
      flavorLabel: 'Vainilla',
      portionsOptionId: 'co-portions-double',
      moldOptionId: 'co-mold-large',
    });

    const selections = await TestBed.inject(RecipeSelectionRepository).byRecipe(new EntityId('re'));
    expect(selections).toHaveLength(1);
    const selection = selections[0];
    expect(selection.id.value).toBe(id);
    expect(selection.flavorLabel).toBe('Vainilla');
    expect(selection.portionsOptionId?.value).toBe('co-portions-double');
    expect(selection.moldOptionId?.value).toBe('co-mold-large');

    const bus = TestBed.inject(EventBus) as RecordingEventBus;
    expect(bus.names()).toContain('RecipeSelected');
  });

  it('rejects an option that does not belong to its group', async () => {
    await expect(
      // co-mold-large pertenece a 'mold', no a 'portions'
      TestBed.inject(SelectRecipe).execute({ recipeId: 're', portionsOptionId: 'co-mold-large' }),
    ).rejects.toThrow();
  });
});
