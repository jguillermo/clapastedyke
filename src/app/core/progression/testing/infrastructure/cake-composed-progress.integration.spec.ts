import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EventBus } from '../../../_common/event-bus';
import { InMemoryEventBus } from '../../../_common/in-memory-event-bus';
import { aPurchase, recipeBookRepositoryProviders } from '../../../recipe-book/testing/recipe-book-test-doubles';
import { SaveIngredient } from '../../../recipe-book/application/use-cases/save-ingredient.use-case';
import { SaveSpongeRecipe } from '../../../recipe-book/application/use-cases/save-sponge-recipe.use-case';
import { SaveFillingRecipe } from '../../../recipe-book/application/use-cases/save-filling-recipe.use-case';
import { SaveCoveringRecipe } from '../../../recipe-book/application/use-cases/save-covering-recipe.use-case';
import { SavePackagingRule } from '../../../recipe-book/application/use-cases/save-packaging-rule.use-case';
import { ComposeCake } from '../../../recipe-book/application/use-cases/compose-cake.use-case';
import { GetProgress } from '../../application/use-cases/get-progress.use-case';
import { ProgressRepository } from '../../domain/repositories/progress.repository';
import { Feature } from '../../domain/feature';
import { MemoryProgressRepository } from '../memory-progress.repository';
import { CakeComposedProgressSubscriber } from '../../infrastructure/cake-composed-progress.subscriber';

/** Seeds the whole catalog and composes a 1 kg cake (publishes CakeComposed). */
async function composeACake(): Promise<void> {
    const ing = TestBed.inject(SaveIngredient);
    const flour = (await ing.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') })).id;
    const manjar = (await ing.execute({ name: 'Manjar', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') })).id;
    const cream = (await ing.execute({ name: 'Chantilly', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') })).id;

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
    const box = (await ing.execute({ name: 'Caja', baseUnit: 'u', usage: 'box', purchasePrice: aPurchase('u') })).id;
    const base = (await ing.execute({ name: 'Base', baseUnit: 'u', usage: 'base', purchasePrice: aPurchase('u') })).id;
    await TestBed.inject(SavePackagingRule).execute({ range: { minGrams: 500, maxGrams: 1500 }, boxId: box, baseId: base });

    await TestBed.inject(ComposeCake).execute({ targetWeightGrams: 1000, spongeId, fillingId, coveringId });
}

describe('recipe-book → progression integration', () => {
    beforeEach(() => {
        const providers: Provider[] = [
            ...recipeBookRepositoryProviders,
            { provide: ProgressRepository, useClass: MemoryProgressRepository },
            { provide: EventBus, useClass: InMemoryEventBus },
        ];
        TestBed.configureTestingModule({ providers });
        // Wire the downstream subscription (done by provideAppInitializer in production).
        TestBed.inject(CakeComposedProgressSubscriber).register();
    });

    it('composing a cake closes Level 0 and unlocks KITCHEN', async () => {
        const before = await TestBed.inject(GetProgress).execute();
        expect(before.currentLevel).toBe(0);
        expect(before.unlockedFeatures).not.toContain(Feature.KITCHEN);

        await composeACake();

        const after = await TestBed.inject(GetProgress).execute();
        expect(after.currentLevel).toBe(1);
        expect(after.unlockedFeatures).toContain(Feature.KITCHEN);
    });

    it('does not advance progression for other recipe-book events (only CakeComposed moves the goal)', async () => {
        await TestBed.inject(SaveIngredient).execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') });

        const after = await TestBed.inject(GetProgress).execute();
        expect(after.currentLevel).toBe(0);
        expect(after.unlockedFeatures).not.toContain(Feature.KITCHEN);
    });
});
