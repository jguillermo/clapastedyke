import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { CakeComposition } from '../../../domain/entities/cake-composition';
import { IngredientLine } from '../../../domain/value-objects/ingredient-line';
import { CakeScalingService, ScalableRecipe } from '../../../domain/services/cake-scaling.service';

const line = (id: string, value: number, unit: 'g' | 'u' = 'g') =>
    IngredientLine.of(new EntityId(id), Quantity.of(value, unit));

const recipe = (weightGrams: number, lines: IngredientLine[]): ScalableRecipe => ({
    lines,
    weight: Quantity.of(weightGrams, 'g'),
});

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

    it('keeps quantities at factor 1 when target equals the reference weights', () => {
        const scaled = service.scale({
            composition: composition(1000),
            recipes: [
                recipe(1000, [line('IN-1', 250), line('IN-2', 4, 'u')]),
                recipe(1000, [line('IN-3', 300)]),
                recipe(1000, [line('IN-4', 200)]),
            ],
        });
        const byId = new Map(scaled.map((s) => [s.ingredientId.value, s.quantity.value]));

        expect(byId.get('IN-1')).toBe(250);
        expect(byId.get('IN-2')).toBe(4);
        expect(byId.get('IN-3')).toBe(300);
        expect(byId.get('IN-4')).toBe(200);
    });

    it('scales every recipe by its own factor when target doubles', () => {
        const scaled = service.scale({
            composition: composition(2000),
            recipes: [recipe(1000, [line('IN-1', 250)]), recipe(1000, [line('IN-3', 300)]), recipe(1000, [line('IN-4', 200)])],
        });
        const byId = new Map(scaled.map((s) => [s.ingredientId.value, s.quantity.value]));

        expect(byId.get('IN-1')).toBe(500);
        expect(byId.get('IN-3')).toBe(600);
        expect(byId.get('IN-4')).toBe(400);
    });

    it('aggregates the same ingredient across recipes into a single line', () => {
        const scaled = service.scale({
            composition: composition(1000),
            recipes: [recipe(1000, [line('IN-1', 250)]), recipe(1000, [line('IN-1', 50)]), recipe(1000, [line('IN-2', 200)])],
        });

        expect(scaled.length).toBe(2);
        expect(scaled.find((s) => s.ingredientId.value === 'IN-1')?.quantity.value).toBe(300);
    });
});
