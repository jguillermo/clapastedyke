import { TestBed } from '@angular/core/testing';
import {
    aPurchase,
    makeRecipe,
    makeRecipeBookFakes,
    makeWeightCategory,
    RecordingEventBus,
} from '../../recipe-book-test-doubles';
import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { EventBus } from '../../../../_common/event-bus';
import { IngredientLine } from '../../../domain/value-objects/ingredient-line';
import { RecipeRepository } from '../../../domain/repositories/recipe.repository';
import { RecipeCategoryRepository } from '../../../domain/repositories/recipe-category.repository';
import { SaveIngredient } from '../../../application/use-cases/save-ingredient.use-case';
import { SavePackagingRule } from '../../../application/use-cases/save-packaging-rule.use-case';
import { ComposeCake } from '../../../application/use-cases/compose-cake.use-case';

interface Seeded {
    spongeId: string;
    fillingId: string;
    coveringId: string;
}

const CAT = 'cat-test';

async function seedRecipes(): Promise<Seeded> {
    const ing = TestBed.inject(SaveIngredient);
    const flour = (await ing.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') })).id;
    const manjar = (await ing.execute({ name: 'Manjar', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') })).id;
    const cream = (await ing.execute({ name: 'Chantilly', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') })).id;

    const categories = TestBed.inject(RecipeCategoryRepository);
    const recipes = TestBed.inject(RecipeRepository);
    await categories.save(makeWeightCategory(CAT, 'Queques'));

    const ln = (id: string, value: number) => IngredientLine.of(new EntityId(id), Quantity.of(value, 'g'));
    await recipes.save(makeRecipe('r-sponge', CAT, 'Vainilla', 1000, [ln(flour, 250)]));
    await recipes.save(makeRecipe('r-filling', CAT, 'Manjar blanco', 1000, [ln(manjar, 300)]));
    await recipes.save(makeRecipe('r-covering', CAT, 'Cobertura', 1000, [ln(cream, 200)]));
    return { spongeId: 'r-sponge', fillingId: 'r-filling', coveringId: 'r-covering' };
}

describe('ComposeCake', () => {
    let bus: RecordingEventBus;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
        bus = TestBed.inject(EventBus) as RecordingEventBus;
    });

    it('throws when no packaging rule covers the target weight', async () => {
        const { spongeId, fillingId, coveringId } = await seedRecipes();
        await expect(
            TestBed.inject(ComposeCake).execute({ targetWeightGrams: 1000, spongeId, fillingId, coveringId }),
        ).rejects.toThrow('No hay caja para este peso');
    });

    it('resolves the suggested packaging, returns the scaled view and emits CakeComposed', async () => {
        const { spongeId, fillingId, coveringId } = await seedRecipes();
        const ing = TestBed.inject(SaveIngredient);
        const box = (await ing.execute({ name: 'Caja', baseUnit: 'u', usage: 'box', purchasePrice: aPurchase('u') })).id;
        const base = (await ing.execute({ name: 'Base', baseUnit: 'u', usage: 'base', purchasePrice: aPurchase('u') })).id;
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
