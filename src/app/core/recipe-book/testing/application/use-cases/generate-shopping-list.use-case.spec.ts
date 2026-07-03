import { TestBed } from '@angular/core/testing';
import { aPurchase, makeRecipeBookFakes, makeWeightCategory, RecordingEventBus } from '../../recipe-book-test-doubles';
import { EventBus } from '../../../../_common/event-bus';
import { RecipeCategoryRepository } from '../../../domain/repositories/recipe-category.repository';
import { SaveIngredient } from '../../../application/use-cases/save-ingredient.use-case';
import { SaveRecipe } from '../../../application/use-cases/save-recipe.use-case';
import { SavePackagingRule } from '../../../application/use-cases/save-packaging-rule.use-case';
import { ComposeCake } from '../../../application/use-cases/compose-cake.use-case';
import { GenerateShoppingList } from '../../../application/use-cases/generate-shopping-list.use-case';

const CAT = 'cat-q';
const PESO = `${CAT}-peso`;

/** Drives the whole Cap 0 flow and returns the list for a 1 kg cake. */
async function runCap0Flow(): Promise<{ compositionId: string }> {
    const ing = TestBed.inject(SaveIngredient);
    const flour = (await ing.execute({ name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') })).id;
    const eggs = (await ing.execute({ name: 'Huevos', baseUnit: 'u', usage: 'recipe', purchasePrice: aPurchase('u') })).id;
    const manjar = (await ing.execute({ name: 'Manjar blanco', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') })).id;
    const cream = (await ing.execute({ name: 'Chantilly', baseUnit: 'g', usage: 'recipe', purchasePrice: aPurchase('g') })).id;

    await TestBed.inject(RecipeCategoryRepository).save(makeWeightCategory(CAT, 'Queques'));
    const recipe = TestBed.inject(SaveRecipe);
    const spongeId = (
        await recipe.execute({
            categoryId: CAT,
            name: 'Queque de vainilla',
            values: [{ propertyId: PESO, value: 1000 }],
            lines: [
                { ingredientId: flour, quantity: 250 },
                { ingredientId: eggs, quantity: 4 },
            ],
        })
    ).id;
    const fillingId = (
        await recipe.execute({
            categoryId: CAT,
            name: 'Manjar blanco',
            values: [{ propertyId: PESO, value: 1000 }],
            lines: [{ ingredientId: manjar, quantity: 300 }],
        })
    ).id;
    const coveringId = (
        await recipe.execute({
            categoryId: CAT,
            name: 'Chantilly',
            values: [{ propertyId: PESO, value: 1000 }],
            lines: [{ ingredientId: cream, quantity: 200 }],
        })
    ).id;
    const topperId = (await ing.execute({ name: 'Feliz cumpleaños', baseUnit: 'u', usage: 'topper', purchasePrice: aPurchase('u') })).id;

    const box = (await ing.execute({ name: 'Caja Nº 20', baseUnit: 'u', usage: 'box', purchasePrice: aPurchase('u') })).id;
    const base = (await ing.execute({ name: 'Base 22 cm', baseUnit: 'u', usage: 'base', purchasePrice: aPurchase('u') })).id;
    await TestBed.inject(SavePackagingRule).execute({ range: { minGrams: 500, maxGrams: 1500 }, boxId: box, baseId: base });

    const { composition } = await TestBed.inject(ComposeCake).execute({
        name: 'Torta 1 kg',
        targetWeightGrams: 1000,
        spongeId,
        fillingId,
        coveringId,
        topperId,
    });
    return { compositionId: composition.id.value };
}

describe('GenerateShoppingList', () => {
    let bus: RecordingEventBus;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
        bus = TestBed.inject(EventBus) as RecordingEventBus;
    });

    it('projects the §9 list (quantities + cost per item + total) and emits ShoppingListGenerated', async () => {
        const { compositionId } = await runCap0Flow();

        const list = await TestBed.inject(GenerateShoppingList).execute({ compositionId });

        const byName = new Map(list.items.map((i) => [i.name, i]));
        // factor 1 (target 1 kg = reference 1 kg), so quantities equal the recipe lines.
        expect(byName.get('Harina')?.quantity).toBe('250 g');
        expect(byName.get('Harina')?.cost).toBe('S/ 1.25'); // 0.005/g · 250 g
        expect(byName.get('Huevos')?.quantity).toBe('4 u');
        expect(byName.get('Manjar blanco')?.quantity).toBe('300 g');
        expect(byName.get('Chantilly')?.quantity).toBe('200 g');
        expect(byName.get('Caja Nº 20')?.category).toBe('packaging');
        expect(byName.get('Base 22 cm')?.category).toBe('packaging');
        expect(byName.get('Feliz cumpleaños')?.category).toBe('topper');
        expect(list.items).toHaveLength(7);
        expect(list.totalCost).toMatch(/^S\/ \d/);

        const event = bus.published.find((e) => e.name === 'ShoppingListGenerated');
        expect(event?.data['itemCount']).toBe(7);
    });

    it('rejects an unknown composition', async () => {
        await expect(TestBed.inject(GenerateShoppingList).execute({ compositionId: 'CK-999' })).rejects.toThrow();
    });
});
