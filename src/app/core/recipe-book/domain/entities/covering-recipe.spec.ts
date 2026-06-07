import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { IngredientLine } from '../value-objects/ingredient-line';
import { CoveringRecipe } from './covering-recipe';

const line = (id: string, value: number) => IngredientLine.of(new EntityId(id), Quantity.of(value, 'g'));
const ref1kg = Quantity.of(1000, 'g');

describe('CoveringRecipe', () => {
    it('requires at least one ingredient line', () => {
        expect(() => CoveringRecipe.create(new EntityId('RC-3'), 'Chantilly', ref1kg, [])).toThrow();
    });

    it('requires a name', () => {
        expect(() => CoveringRecipe.create(new EntityId('RC-3'), '', ref1kg, [line('IN-5', 200)])).toThrow();
    });

    it('addLine returns a new instance', () => {
        const original = CoveringRecipe.create(new EntityId('RC-3'), 'Chantilly', ref1kg, [line('IN-5', 200)]);
        const updated = original.addLine(line('IN-6', 50));
        expect(updated.lines.length).toBe(2);
        expect(original.lines.length).toBe(1);
    });

    it('is equal by id', () => {
        const a = CoveringRecipe.create(new EntityId('RC-3'), 'Chantilly', ref1kg, [line('IN-5', 200)]);
        const b = CoveringRecipe.create(new EntityId('RC-3'), 'Otra', ref1kg, [line('IN-9', 9)]);
        expect(a.equals(b)).toBe(true);
    });
});
