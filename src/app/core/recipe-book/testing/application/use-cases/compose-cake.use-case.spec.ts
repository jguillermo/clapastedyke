import { TestBed } from '@angular/core/testing';
import { makeRecipeBookFakes, RecordingEventBus } from '../../recipe-book-test-doubles';
import { EventBus } from '../../../../_common/event-bus';
import { SaveIngredient } from '../../../application/use-cases/save-ingredient.use-case';
import { SaveSpongeRecipe } from '../../../application/use-cases/save-sponge-recipe.use-case';
import { SaveFillingRecipe } from '../../../application/use-cases/save-filling-recipe.use-case';
import { SaveCoveringRecipe } from '../../../application/use-cases/save-covering-recipe.use-case';
import { SavePackagingItem } from '../../../application/use-cases/save-packaging-item.use-case';
import { SavePackagingRule } from '../../../application/use-cases/save-packaging-rule.use-case';
import { ComposeCake } from '../../../application/use-cases/compose-cake.use-case';

interface Seeded {
    spongeId: string;
    fillingId: string;
    coveringId: string;
}

async function seedRecipes(): Promise<Seeded> {
    const ing = TestBed.inject(SaveIngredient);
    const flour = (await ing.execute({ name: 'Harina', baseUnit: 'g' })).id;
    const manjar = (await ing.execute({ name: 'Manjar', baseUnit: 'g' })).id;
    const cream = (await ing.execute({ name: 'Chantilly', baseUnit: 'g' })).id;

    const spongeId = (
        await TestBed.inject(SaveSpongeRecipe).execute({
            name: 'Vainilla',
            referenceYield: { weightGrams: 1000 },
            lines: [{ ingredientId: flour, quantity: 250 }],
        })
    ).id;
    const fillingId = (
        await TestBed.inject(SaveFillingRecipe).execute({
            name: 'Manjar blanco',
            referenceWeightGrams: 1000,
            lines: [{ ingredientId: manjar, quantity: 300 }],
        })
    ).id;
    const coveringId = (
        await TestBed.inject(SaveCoveringRecipe).execute({
            name: 'Cobertura',
            referenceWeightGrams: 1000,
            lines: [{ ingredientId: cream, quantity: 200 }],
        })
    ).id;
    return { spongeId, fillingId, coveringId };
}

describe('ComposeCake', () => {
    let bus: RecordingEventBus;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
        bus = TestBed.inject(EventBus) as RecordingEventBus;
    });

    it('throws when no packaging rule covers the target weight (§11.2)', async () => {
        const { spongeId, fillingId, coveringId } = await seedRecipes();
        await expect(
            TestBed.inject(ComposeCake).execute({ targetWeightGrams: 1000, spongeId, fillingId, coveringId }),
        ).rejects.toThrow('No hay caja para este peso');
    });

    it('resolves the suggested packaging, returns the scaled view and emits CakeComposed', async () => {
        const { spongeId, fillingId, coveringId } = await seedRecipes();
        const box = (await TestBed.inject(SavePackagingItem).execute({ name: 'Caja', type: 'box' })).id;
        const base = (await TestBed.inject(SavePackagingItem).execute({ name: 'Base', type: 'base' })).id;
        await TestBed.inject(SavePackagingRule).execute({
            range: { minGrams: 500, maxGrams: 1500 },
            boxId: box,
            baseId: base,
        });

        const { composition, scaled } = await TestBed.inject(ComposeCake).execute({
            targetWeightGrams: 1000,
            spongeId,
            fillingId,
            coveringId,
        });

        expect(composition.suggestedBoxId.value).toBe(box);
        expect(composition.suggestedBaseId.value).toBe(base);
        expect(scaled).toHaveLength(3);
        expect(bus.names()).toContain('CakeComposed');
    });
});
