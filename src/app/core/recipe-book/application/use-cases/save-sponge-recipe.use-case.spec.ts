import { TestBed } from '@angular/core/testing';
import { makeRecipeBookFakes, RecordingEventBus } from '../../testing/recipe-book-test-doubles';
import { SpongeRecipeRepository } from '../../domain/repositories/sponge-recipe.repository';
import { EventBus } from '../../../_common/event-bus';
import { EntityId } from '../../../_common/entity-id';
import { SaveIngredient } from './save-ingredient.use-case';
import { SaveSpongeRecipe } from './save-sponge-recipe.use-case';

describe('SaveSpongeRecipe', () => {
    let bus: RecordingEventBus;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
        bus = TestBed.inject(EventBus) as RecordingEventBus;
    });

    it('builds lines from existing ingredients and emits SpongeRecipeSaved', async () => {
        const flour = await TestBed.inject(SaveIngredient).execute({ name: 'Harina', baseUnit: 'g' });

        const result = await TestBed.inject(SaveSpongeRecipe).execute({
            name: 'Queque de vainilla',
            flavor: 'Vainilla',
            referenceYield: { weightGrams: 1000, servings: 8 },
            lines: [{ ingredientId: flour.id, quantity: 250 }],
        });

        const stored = await TestBed.inject(SpongeRecipeRepository).byId(new EntityId(result.id));
        expect(stored?.lines).toHaveLength(1);
        expect(stored?.lines[0].quantity.value).toBe(250);
        expect(stored?.lines[0].quantity.unit).toBe('g'); // unit derived from the ingredient
        expect(bus.names()).toContain('SpongeRecipeSaved');
    });

    it('rejects a line referencing a non-existent ingredient (§11.2)', async () => {
        await expect(
            TestBed.inject(SaveSpongeRecipe).execute({
                name: 'Queque',
                referenceYield: { weightGrams: 1000 },
                lines: [{ ingredientId: 'IN-999', quantity: 250 }],
            }),
        ).rejects.toThrow();
    });
});
