import { TestBed } from '@angular/core/testing';
import { makeRecipeBookFakes } from '../../recipe-book-test-doubles';
import { SavePackagingItem } from '../../../application/use-cases/save-packaging-item.use-case';
import { SavePackagingRule } from '../../../application/use-cases/save-packaging-rule.use-case';

describe('SavePackagingRule', () => {
    let box: string;
    let base: string;

    beforeEach(async () => {
        TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
        const saveItem = TestBed.inject(SavePackagingItem);
        box = (await saveItem.execute({ name: 'Caja Nº 20', type: 'box' })).id;
        base = (await saveItem.execute({ name: 'Base 22 cm', type: 'base' })).id;
    });

    it('saves a rule when box and base exist with the right type', async () => {
        const result = await TestBed.inject(SavePackagingRule).execute({
            range: { minGrams: 500, maxGrams: 1500 },
            boxId: box,
            baseId: base,
        });
        expect(result.id).toBeTruthy();
    });

    it('rejects when the box id is actually a base (wrong type)', async () => {
        await expect(
            TestBed.inject(SavePackagingRule).execute({
                range: { minGrams: 500, maxGrams: 1500 },
                boxId: base, // a base passed where a box is expected
                baseId: base,
            }),
        ).rejects.toThrow();
    });

    it('rejects a band that overlaps an existing rule (§11.2)', async () => {
        const useCase = TestBed.inject(SavePackagingRule);
        await useCase.execute({ range: { minGrams: 500, maxGrams: 1500 }, boxId: box, baseId: base });
        await expect(
            useCase.execute({ range: { minGrams: 1000, maxGrams: 2000 }, boxId: box, baseId: base }),
        ).rejects.toThrow();
    });
});
