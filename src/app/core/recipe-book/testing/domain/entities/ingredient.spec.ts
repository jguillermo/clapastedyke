import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { Ingredient } from '../../../domain/entities/ingredient';
import { PurchasePrice } from '../../../domain/value-objects/purchase-price';

const price = (amount: number) => PurchasePrice.of(amount, Quantity.of(1000, 'g'));

describe('Ingredient', () => {
    it('create records the initial price as IngredientRepriced { previousPrice: null }', () => {
        const ingredient = Ingredient.create(new EntityId('IN-1'), 'Harina', 'g', 'recipe', price(5));
        const events = ingredient.pullEvents();

        expect(events).toHaveLength(1);
        expect(events[0].name).toBe('IngredientRepriced');
        expect(events[0].data['previousPrice']).toBeNull();
        expect(events[0].data['newPrice']).toEqual({ amount: 5, per: { value: 1000, unit: 'g' } });
    });

    it('restore does not record any event (rehydration from storage)', () => {
        const ingredient = Ingredient.restore({
            id: new EntityId('IN-1'),
            name: 'Harina',
            baseUnit: 'g',
            usage: 'recipe',
            purchasePrice: price(5),
        });
        expect(ingredient.pullEvents()).toHaveLength(0);
    });

    it('repricedTo returns a new instance and records the change with the previous price', () => {
        const original = Ingredient.restore({
            id: new EntityId('IN-1'),
            name: 'Harina',
            baseUnit: 'g',
            usage: 'recipe',
            purchasePrice: price(5),
        });
        const updated = original.repricedTo(price(8));

        expect(updated).not.toBe(original);
        expect(updated.purchasePrice.amount).toBe(8);
        expect(original.purchasePrice.amount).toBe(5); // immutable
        const events = updated.pullEvents();
        expect(events[0].data['previousPrice']).toEqual({ amount: 5, per: { value: 1000, unit: 'g' } });
        expect(events[0].data['newPrice']).toEqual({ amount: 8, per: { value: 1000, unit: 'g' } });
    });

    it('equals by id', () => {
        const a = Ingredient.create(new EntityId('IN-1'), 'Harina', 'g', 'recipe', price(5));
        const b = Ingredient.create(new EntityId('IN-1'), 'Otra', 'u', 'topper', price(9));
        expect(a.equals(b)).toBe(true);
    });
});
