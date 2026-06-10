import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { CakeComposition } from '../../../domain/entities/cake-composition';
import { CoveringRecipe } from '../../../domain/entities/covering-recipe';
import { FillingRecipe } from '../../../domain/entities/filling-recipe';
import { SpongeRecipe } from '../../../domain/entities/sponge-recipe';
import { IngredientLine } from '../../../domain/value-objects/ingredient-line';
import { RecipeYield } from '../../../domain/value-objects/recipe-yield';
import { CakeScalingService } from '../../../domain/services/cake-scaling.service';

const line = (id: string, value: number, unit: 'g' | 'u' = 'g') =>
    IngredientLine.of(new EntityId(id), Quantity.of(value, unit));

const composition = (targetWeight: number) =>
    CakeComposition.compose({
        id: new EntityId('CK-1'),
        targetWeight: Quantity.of(targetWeight, 'g'),
        spongeRecipeId: new EntityId('RC-1'),
        fillingRecipeId: new EntityId('RC-2'),
        coveringRecipeId: new EntityId('RC-3'),
        suggestedBoxId: new EntityId('PK-box'),
        suggestedBaseId: new EntityId('PK-base'),
    });

describe('CakeScalingService', () => {
    const service = new CakeScalingService();

    it('keeps quantities at factor 1 when target equals the reference weights (§9 example)', () => {
        const sponge = SpongeRecipe.create(new EntityId('RC-1'), 'Vainilla', RecipeYield.of(Quantity.of(1000, 'g'), 8), [
            line('IN-1', 250), // Harina
            line('IN-2', 4, 'u'), // Huevos
        ]);
        const filling = FillingRecipe.create(new EntityId('RC-2'), 'Manjar', Quantity.of(1000, 'g'), [line('IN-3', 300)]);
        const covering = CoveringRecipe.create(new EntityId('RC-3'), 'Chantilly', Quantity.of(1000, 'g'), [
            line('IN-4', 200),
        ]);

        const scaled = service.scale({ composition: composition(1000), sponge, filling, covering });
        const byId = new Map(scaled.map((s) => [s.ingredientId.value, s.quantity]));

        expect(byId.get('IN-1')?.value).toBe(250);
        expect(byId.get('IN-2')?.value).toBe(4);
        expect(byId.get('IN-3')?.value).toBe(300);
        expect(byId.get('IN-4')?.value).toBe(200);
    });

    it('scales every recipe by its own factor when target doubles', () => {
        const sponge = SpongeRecipe.create(new EntityId('RC-1'), 'Vainilla', RecipeYield.of(Quantity.of(1000, 'g')), [
            line('IN-1', 250),
        ]);
        const filling = FillingRecipe.create(new EntityId('RC-2'), 'Manjar', Quantity.of(1000, 'g'), [line('IN-3', 300)]);
        const covering = CoveringRecipe.create(new EntityId('RC-3'), 'Chantilly', Quantity.of(1000, 'g'), [
            line('IN-4', 200),
        ]);

        const scaled = service.scale({ composition: composition(2000), sponge, filling, covering });
        const byId = new Map(scaled.map((s) => [s.ingredientId.value, s.quantity.value]));

        expect(byId.get('IN-1')).toBe(500);
        expect(byId.get('IN-3')).toBe(600);
        expect(byId.get('IN-4')).toBe(400);
    });

    it('aggregates the same ingredient across recipes into a single line', () => {
        const sponge = SpongeRecipe.create(new EntityId('RC-1'), 'Vainilla', RecipeYield.of(Quantity.of(1000, 'g')), [
            line('IN-1', 250), // sugar in the sponge
        ]);
        const filling = FillingRecipe.create(new EntityId('RC-2'), 'Manjar', Quantity.of(1000, 'g'), [
            line('IN-1', 50), // same sugar in the filling
        ]);
        const covering = CoveringRecipe.create(new EntityId('RC-3'), 'Chantilly', Quantity.of(1000, 'g'), [
            line('IN-2', 200),
        ]);

        const scaled = service.scale({ composition: composition(1000), sponge, filling, covering });

        expect(scaled.length).toBe(2);
        expect(scaled.find((s) => s.ingredientId.value === 'IN-1')?.quantity.value).toBe(300);
    });
});
