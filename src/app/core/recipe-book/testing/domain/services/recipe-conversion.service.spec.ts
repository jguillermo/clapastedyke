import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { IngredientLine } from '../../../domain/value-objects/ingredient-line';
import { RecipeConversionService } from '../../../domain/services/recipe-conversion.service';

describe('RecipeConversionService', () => {
  const service = new RecipeConversionService();
  const lines = [
    IngredientLine.of(new EntityId('in-1'), Quantity.of(1000, 'g')),
    IngredientLine.of(new EntityId('in-2'), Quantity.of(3, 'u')),
  ];

  it('factor 2 scales every line', () => {
    const result = service.convert({ lines, factor: 2 });
    expect(result.lines[0].quantity.value).toBe(2000);
    expect(result.lines[1].quantity.value).toBe(6);
  });

  it('factor 0.5 halves the base values', () => {
    const result = service.convert({ lines, factor: 0.5 });
    expect(result.lines[0].quantity.value).toBe(500);
  });

  it('factor 1 leaves the recipe unchanged', () => {
    const result = service.convert({ lines, factor: 1 });
    expect(result.lines[0].quantity.value).toBe(1000);
    expect(result.lines[1].quantity.value).toBe(3);
  });

  it('combined factor (porciones × molde) scales accordingly', () => {
    const result = service.convert({ lines, factor: 2 * 0.5 });
    expect(result.lines[0].quantity.value).toBe(1000);
  });
});
