import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { ScaledIngredient } from '../../../domain/services/cake-scaling.service';
import { ShoppingListBuilder } from '../../../domain/services/shopping-list-builder.service';
import { makeIngredient } from '../../recipe-book-test-doubles';

const scaled = (id: string, value: number, unit: 'g' | 'u' = 'g'): ScaledIngredient => ({
    ingredientId: new EntityId(id),
    quantity: Quantity.of(value, unit),
});

describe('ShoppingListBuilder', () => {
    const builder = new ShoppingListBuilder();
    // Box/base/topper are Ingredients too (told apart by usage), each with its price.
    const box = makeIngredient('PK-box', 'Caja Nº 20', { usage: 'box', baseUnit: 'u', amount: 20, per: Quantity.of(10, 'u') });
    const base = makeIngredient('PK-base', 'Base 22 cm', { usage: 'base', baseUnit: 'u', amount: 10, per: Quantity.of(10, 'u') });
    const topper = makeIngredient('TP-1', 'Feliz cumpleaños', { usage: 'topper', baseUnit: 'u', amount: 3, per: Quantity.of(1, 'u') });

    it('projects the §9 list with names, quantities, proportional cost per item and a total', () => {
        const list = builder.build({
            scaled: [scaled('IN-1', 300), scaled('IN-2', 4, 'u'), scaled('IN-3', 300), scaled('IN-4', 200)],
            ingredients: [
                makeIngredient('IN-1', 'Harina', { amount: 5, per: Quantity.of(1000, 'g') }), // 0.005/g → 300g = 1.50
                makeIngredient('IN-2', 'Huevos', { baseUnit: 'u', amount: 12, per: Quantity.of(30, 'u') }), // 0.40/u → 4u = 1.60
                makeIngredient('IN-3', 'Manjar blanco', { amount: 10, per: Quantity.of(1000, 'g') }), // 0.01/g → 300g = 3.00
                makeIngredient('IN-4', 'Chantilly', { amount: 12, per: Quantity.of(1000, 'g') }), // 0.012/g → 200g = 2.40
            ],
            box,
            base,
            topper,
        });

        const byName = new Map(list.items.map((i) => [i.name, i]));
        expect(byName.get('Harina')?.cost).toBeCloseTo(1.5, 5);
        expect(byName.get('Huevos')?.cost).toBeCloseTo(1.6, 5);
        expect(byName.get('Manjar blanco')?.cost).toBeCloseTo(3, 5);
        expect(byName.get('Chantilly')?.cost).toBeCloseTo(2.4, 5);
        expect(byName.get('Caja Nº 20')?.cost).toBeCloseTo(2, 5);
        expect(byName.get('Caja Nº 20')?.category).toBe('packaging');
        expect(byName.get('Feliz cumpleaños')?.cost).toBeCloseTo(3, 5);
        expect(byName.get('Feliz cumpleaños')?.category).toBe('topper');
        expect(list.totalCost).toBeCloseTo(14.5, 5); // 1.5+1.6+3+2.4 (ingredientes) + 2+1 (caja+base) + 3 (topper)
        expect(list.items).toHaveLength(7);
    });

    it('omits the topper line when none is chosen', () => {
        const list = builder.build({
            scaled: [scaled('IN-1', 250)],
            ingredients: [makeIngredient('IN-1', 'Harina')],
            box,
            base,
        });

        expect(list.items.some((i) => i.category === 'topper')).toBe(false);
        expect(list.items.filter((i) => i.category === 'packaging').length).toBe(2);
    });
});
