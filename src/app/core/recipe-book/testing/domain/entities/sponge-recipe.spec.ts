import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { IngredientLine } from '../../../domain/value-objects/ingredient-line';
import { RecipeYield } from '../../../domain/value-objects/recipe-yield';
import { SpongeRecipe } from '../../../domain/entities/sponge-recipe';

const line = (id: string, value: number) => IngredientLine.of(new EntityId(id), Quantity.of(value, 'g'));
const yield1kg = RecipeYield.of(Quantity.of(1000, 'g'), 8);

describe('SpongeRecipe', () => {
    it('requires at least one ingredient line', () => {
        expect(() => SpongeRecipe.create(new EntityId('RC-1'), 'Vainilla', yield1kg, [])).toThrow();
    });

    it('requires a name', () => {
        expect(() => SpongeRecipe.create(new EntityId('RC-1'), '  ', yield1kg, [line('IN-1', 250)])).toThrow();
    });

    it('addLine returns a new instance and leaves the original untouched', () => {
        const original = SpongeRecipe.create(new EntityId('RC-1'), 'Vainilla', yield1kg, [line('IN-1', 250)]);
        const updated = original.addLine(line('IN-2', 4));
        expect(updated.lines.length).toBe(2);
        expect(original.lines.length).toBe(1);
        expect(updated).not.toBe(original);
    });

    it('changeYield returns a new instance with the new yield', () => {
        const original = SpongeRecipe.create(new EntityId('RC-1'), 'Vainilla', yield1kg, [line('IN-1', 250)]);
        const updated = original.changeYield(RecipeYield.of(Quantity.of(2000, 'g')));
        expect(updated.referenceYield.weight.value).toBe(2000);
        expect(original.referenceYield.weight.value).toBe(1000);
    });

    it('is equal by id', () => {
        const a = SpongeRecipe.create(new EntityId('RC-1'), 'Vainilla', yield1kg, [line('IN-1', 250)]);
        const b = SpongeRecipe.create(new EntityId('RC-1'), 'Chocolate', yield1kg, [line('IN-9', 9)]);
        expect(a.equals(b)).toBe(true);
    });
});
