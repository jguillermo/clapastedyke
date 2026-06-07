import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { SpongeRecipe } from '../../domain/entities/sponge-recipe';
import { IngredientLine } from '../../domain/value-objects/ingredient-line';
import { RecipeYield } from '../../domain/value-objects/recipe-yield';
import { SpongeRecipeMapper } from '../../infrastructure/sponge-recipe.mapper';

describe('SpongeRecipeMapper', () => {
    it('round-trips a sponge recipe with yield, flavor and lines', () => {
        const original = SpongeRecipe.create(
            new EntityId('SP-1'),
            'Queque de vainilla',
            RecipeYield.of(Quantity.of(1000, 'g'), 8),
            [
                IngredientLine.of(new EntityId('IN-1'), Quantity.of(250, 'g')),
                IngredientLine.of(new EntityId('IN-2'), Quantity.of(4, 'u')),
            ],
            'Vainilla',
        );

        const restored = SpongeRecipeMapper.toDomain(SpongeRecipeMapper.toRecord(original));

        expect(restored.equals(original)).toBe(true);
        expect(restored.flavor).toBe('Vainilla');
        expect(restored.referenceYield.weight.value).toBe(1000);
        expect(restored.referenceYield.servings).toBe(8);
        expect(restored.lines).toHaveLength(2);
        expect(restored.lines[1].quantity.unit).toBe('u');
    });
});
