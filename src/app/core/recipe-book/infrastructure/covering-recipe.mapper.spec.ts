import { EntityId } from '../../_common/entity-id';
import { Quantity } from '../../_common/quantity';
import { CoveringRecipe } from '../domain/entities/covering-recipe';
import { IngredientLine } from '../domain/value-objects/ingredient-line';
import { CoveringRecipeMapper } from './covering-recipe.mapper';

describe('CoveringRecipeMapper', () => {
    it('round-trips a covering recipe', () => {
        const original = CoveringRecipe.create(new EntityId('CV-1'), 'Chantilly', Quantity.of(1000, 'g'), [
            IngredientLine.of(new EntityId('IN-4'), Quantity.of(200, 'g')),
        ]);

        const restored = CoveringRecipeMapper.toDomain(CoveringRecipeMapper.toRecord(original));

        expect(restored.equals(original)).toBe(true);
        expect(restored.referenceWeight.value).toBe(1000);
        expect(restored.lines[0].quantity.value).toBe(200);
    });
});
