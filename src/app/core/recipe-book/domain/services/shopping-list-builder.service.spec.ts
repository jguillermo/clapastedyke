import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { Ingredient } from '../entities/ingredient';
import { PackagingItem } from '../entities/packaging-item';
import { Topper } from '../entities/topper';
import { ScaledIngredient } from './cake-scaling.service';
import { ShoppingListBuilder } from './shopping-list-builder.service';

const ingredient = (id: string, name: string, unit: 'g' | 'u' = 'g') => Ingredient.create(new EntityId(id), name, unit);
const scaled = (id: string, value: number, unit: 'g' | 'u' = 'g'): ScaledIngredient => ({
    ingredientId: new EntityId(id),
    quantity: Quantity.of(value, unit),
});

describe('ShoppingListBuilder', () => {
    const builder = new ShoppingListBuilder();
    const box = PackagingItem.create(new EntityId('PK-box'), 'Caja Nº 20', 'box');
    const base = PackagingItem.create(new EntityId('PK-base'), 'Base 22 cm', 'base');

    it('projects the §9 list with named ingredients, packaging and topper — quantities only', () => {
        const list = builder.build({
            scaled: [scaled('IN-1', 250), scaled('IN-2', 4, 'u'), scaled('IN-3', 300), scaled('IN-4', 200)],
            ingredients: [
                ingredient('IN-1', 'Harina'),
                ingredient('IN-2', 'Huevos', 'u'),
                ingredient('IN-3', 'Manjar blanco'),
                ingredient('IN-4', 'Chantilly'),
            ],
            box,
            base,
            topper: Topper.create(new EntityId('TP-1'), 'Feliz cumpleaños'),
        });

        expect(list.items).toEqual([
            { name: 'Harina', totalQuantity: Quantity.of(250, 'g'), category: 'ingredient' },
            { name: 'Huevos', totalQuantity: Quantity.of(4, 'u'), category: 'ingredient' },
            { name: 'Manjar blanco', totalQuantity: Quantity.of(300, 'g'), category: 'ingredient' },
            { name: 'Chantilly', totalQuantity: Quantity.of(200, 'g'), category: 'ingredient' },
            { name: 'Caja Nº 20', totalQuantity: Quantity.of(1, 'u'), category: 'packaging' },
            { name: 'Base 22 cm', totalQuantity: Quantity.of(1, 'u'), category: 'packaging' },
            { name: 'Feliz cumpleaños', totalQuantity: Quantity.of(1, 'u'), category: 'topper' },
        ]);
    });

    it('omits the topper line when none is chosen', () => {
        const list = builder.build({
            scaled: [scaled('IN-1', 250)],
            ingredients: [ingredient('IN-1', 'Harina')],
            box,
            base,
        });

        expect(list.items.some((i) => i.category === 'topper')).toBe(false);
        expect(list.items.filter((i) => i.category === 'packaging').length).toBe(2);
    });
});
