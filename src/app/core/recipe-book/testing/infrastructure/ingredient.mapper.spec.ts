import { EntityId } from '../../../_common/entity-id';
import { Ingredient } from '../../domain/entities/ingredient';
import { IngredientMapper } from '../../infrastructure/ingredient.mapper';

describe('IngredientMapper', () => {
    it('round-trips an ingredient through its record', () => {
        const original = Ingredient.create(new EntityId('IN-1'), 'Harina', 'g');
        const restored = IngredientMapper.toDomain(IngredientMapper.toRecord(original));

        expect(restored.equals(original)).toBe(true);
        expect(restored.name).toBe('Harina');
        expect(restored.baseUnit).toBe('g');
    });
});
