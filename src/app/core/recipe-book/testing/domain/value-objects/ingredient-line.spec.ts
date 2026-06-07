import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { IngredientLine } from '../../../domain/value-objects/ingredient-line';

describe('IngredientLine', () => {
    it('composes an ingredient id with a quantity', () => {
        const line = IngredientLine.of(new EntityId('IN-1'), Quantity.of(250, 'g'));
        expect(line.ingredientId.value).toBe('IN-1');
        expect(line.quantity.value).toBe(250);
    });

    it('rejects a non-positive quantity (via Quantity)', () => {
        expect(() => IngredientLine.of(new EntityId('IN-1'), Quantity.of(0, 'g'))).toThrow();
    });

    it('is equal by value', () => {
        const a = IngredientLine.of(new EntityId('IN-1'), Quantity.of(250, 'g'));
        const b = IngredientLine.of(new EntityId('IN-1'), Quantity.of(250, 'g'));
        expect(a.equals(b)).toBe(true);
        expect(a.equals(IngredientLine.of(new EntityId('IN-2'), Quantity.of(250, 'g')))).toBe(false);
    });
});
