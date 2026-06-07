import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { FillingRecipe } from '../../domain/entities/filling-recipe';
import { IngredientLine } from '../../domain/value-objects/ingredient-line';
import { FillingRecipeMapper } from '../../infrastructure/filling-recipe.mapper';

describe('FillingRecipeMapper', () => {
    it('round-trips a filling recipe', () => {
        const original = FillingRecipe.create(new EntityId('FL-1'), 'Manjar blanco', Quantity.of(1000, 'g'), [
            IngredientLine.of(new EntityId('IN-3'), Quantity.of(300, 'g')),
        ]);

        const restored = FillingRecipeMapper.toDomain(FillingRecipeMapper.toRecord(original));

        expect(restored.equals(original)).toBe(true);
        expect(restored.referenceWeight.value).toBe(1000);
        expect(restored.lines[0].quantity.value).toBe(300);
    });
});
