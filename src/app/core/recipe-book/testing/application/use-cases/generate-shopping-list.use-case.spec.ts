import { TestBed } from '@angular/core/testing';
import { makeRecipeBookFakes, RecordingEventBus } from '../../recipe-book-test-doubles';
import { EventBus } from '../../../../_common/event-bus';
import { SaveIngredient } from '../../../application/use-cases/save-ingredient.use-case';
import { SaveSpongeRecipe } from '../../../application/use-cases/save-sponge-recipe.use-case';
import { SaveFillingRecipe } from '../../../application/use-cases/save-filling-recipe.use-case';
import { SaveCoveringRecipe } from '../../../application/use-cases/save-covering-recipe.use-case';
import { SaveTopper } from '../../../application/use-cases/save-topper.use-case';
import { SavePackagingItem } from '../../../application/use-cases/save-packaging-item.use-case';
import { SavePackagingRule } from '../../../application/use-cases/save-packaging-rule.use-case';
import { ComposeCake } from '../../../application/use-cases/compose-cake.use-case';
import { GenerateShoppingList } from '../../../application/use-cases/generate-shopping-list.use-case';

/** Drives the whole Cap 0 flow and returns the list for a 1 kg cake (§9). */
async function runCap0Flow(): Promise<{ compositionId: string }> {
    const ing = TestBed.inject(SaveIngredient);
    const flour = (await ing.execute({ name: 'Harina', baseUnit: 'g' })).id;
    const eggs = (await ing.execute({ name: 'Huevos', baseUnit: 'u' })).id;
    const manjar = (await ing.execute({ name: 'Manjar blanco', baseUnit: 'g' })).id;
    const cream = (await ing.execute({ name: 'Chantilly', baseUnit: 'g' })).id;

    const spongeId = (
        await TestBed.inject(SaveSpongeRecipe).execute({
            name: 'Queque de vainilla',
            referenceYield: { weightGrams: 1000, servings: 8 },
            lines: [
                { ingredientId: flour, quantity: 250 },
                { ingredientId: eggs, quantity: 4 },
            ],
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
            name: 'Chantilly',
            referenceWeightGrams: 1000,
            lines: [{ ingredientId: cream, quantity: 200 }],
        })
    ).id;
    const topperId = (await TestBed.inject(SaveTopper).execute({ name: 'Feliz cumpleaños' })).id;

    const box = (await TestBed.inject(SavePackagingItem).execute({ name: 'Caja Nº 20', type: 'box' })).id;
    const base = (await TestBed.inject(SavePackagingItem).execute({ name: 'Base 22 cm', type: 'base' })).id;
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

    it('projects the §9 list (quantities only) and emits ShoppingListGenerated', async () => {
        const { compositionId } = await runCap0Flow();

        const list = await TestBed.inject(GenerateShoppingList).execute({ compositionId });

        const byName = new Map(list.items.map((i) => [i.name, i]));
        expect(byName.get('Harina')?.totalQuantity.value).toBe(250);
        expect(byName.get('Huevos')?.totalQuantity.value).toBe(4);
        expect(byName.get('Huevos')?.totalQuantity.unit).toBe('u');
        expect(byName.get('Manjar blanco')?.totalQuantity.value).toBe(300);
        expect(byName.get('Chantilly')?.totalQuantity.value).toBe(200);
        expect(byName.get('Caja Nº 20')?.category).toBe('packaging');
        expect(byName.get('Base 22 cm')?.category).toBe('packaging');
        expect(byName.get('Feliz cumpleaños')?.category).toBe('topper');
        expect(list.items).toHaveLength(7);

        const event = bus.published.find((e) => e.name === 'ShoppingListGenerated');
        expect(event?.data['itemCount']).toBe(7);
    });

    it('rejects an unknown composition', async () => {
        await expect(TestBed.inject(GenerateShoppingList).execute({ compositionId: 'CK-999' })).rejects.toThrow();
    });
});
