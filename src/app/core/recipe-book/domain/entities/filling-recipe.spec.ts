import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { IngredientLine } from '../value-objects/ingredient-line';
import { FillingRecipe } from './filling-recipe';

const line = (id: string, value: number) => IngredientLine.of(new EntityId(id), Quantity.of(value, 'g'));
const ref1kg = Quantity.of(1000, 'g');

describe('FillingRecipe', () => {
    it('requires at least one ingredient line', () => {
        expect(() => FillingRecipe.create(new EntityId('RC-2'), 'Manjar', ref1kg, [])).toThrow();
    });

    it('requires a name', () => {
        expect(() => FillingRecipe.create(new EntityId('RC-2'), '', ref1kg, [line('IN-3', 300)])).toThrow();
    });

    it('addLine returns a new instance', () => {
        const original = FillingRecipe.create(new EntityId('RC-2'), 'Manjar', ref1kg, [line('IN-3', 300)]);
        const updated = original.addLine(line('IN-4', 100));
        expect(updated.lines.length).toBe(2);
        expect(original.lines.length).toBe(1);
        expect(updated).not.toBe(original);
    });

    it('is equal by id', () => {
        const a = FillingRecipe.create(new EntityId('RC-2'), 'Manjar', ref1kg, [line('IN-3', 300)]);
        const b = FillingRecipe.create(new EntityId('RC-2'), 'Otro', ref1kg, [line('IN-9', 9)]);
        expect(a.equals(b)).toBe(true);
    });
});
