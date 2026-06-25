import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../../_common/entity-id';
import { makeRecipeBookFakes, makeWeightCategory } from '../../recipe-book-test-doubles';
import { RecipeCategoryRepository } from '../../../domain/repositories/recipe-category.repository';
import { SaveRecipeCategory } from '../../../application/use-cases/save-recipe-category.use-case';

describe('SaveRecipeCategory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
  });

  it('creates categories appended at the end (increasing order)', async () => {
    const uc = TestBed.inject(SaveRecipeCategory);
    const a = await uc.execute({ name: 'Galletas', properties: [] });
    const b = await uc.execute({ name: 'Pie', properties: [{ name: 'Sabor', type: 'text', required: false }] });

    const repo = TestBed.inject(RecipeCategoryRepository);
    const galletas = await repo.byId(new EntityId(a.id));
    const pie = await repo.byId(new EntityId(b.id));
    expect(galletas?.order).toBe(0);
    expect(pie?.order).toBe(1);
    expect(pie?.properties[0].name).toBe('Sabor');
  });

  it('rejects a duplicate category name', async () => {
    const uc = TestBed.inject(SaveRecipeCategory);
    await uc.execute({ name: 'Galletas', properties: [] });
    await expect(uc.execute({ name: 'galletas', properties: [] })).rejects.toThrow();
  });

  it('editing a system category preserves its locked Peso property', async () => {
    const repo = TestBed.inject(RecipeCategoryRepository);
    await repo.save(makeWeightCategory('sys-q', 'Queques'));

    const result = await TestBed.inject(SaveRecipeCategory).execute({
      id: 'sys-q',
      name: 'Queques',
      properties: [
        { id: 'sys-q-peso', name: 'Peso', type: 'weight', required: true },
        { name: 'Sabor', type: 'text', required: false },
      ],
    });

    const edited = await repo.byId(new EntityId(result.id));
    const peso = edited?.property('sys-q-peso');
    expect(peso?.locked).toBe(true);
    expect(peso?.role).toBe('scaling-weight');
    expect(edited?.properties).toHaveLength(2);
  });

  it('rejects editing a system category that drops its locked property', async () => {
    const repo = TestBed.inject(RecipeCategoryRepository);
    await repo.save(makeWeightCategory('sys-q', 'Queques'));
    await expect(
      TestBed.inject(SaveRecipeCategory).execute({ id: 'sys-q', name: 'Queques', properties: [] }),
    ).rejects.toThrow();
  });
});
