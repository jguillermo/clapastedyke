import { TestBed } from '@angular/core/testing';
import { makeRecipeBookFakes } from '../recipe-book-test-doubles';
import { RecipeCategoryRepository } from '../../domain/repositories/recipe-category.repository';
import { RecipeBookSeed } from '../../infrastructure/recipe-book-seed';

describe('RecipeBookSeed', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
  });

  it('seeds the three system categories on an empty store', async () => {
    await TestBed.inject(RecipeBookSeed).run();
    const categories = await TestBed.inject(RecipeCategoryRepository).all();
    expect(categories.map((c) => c.name).sort()).toEqual(['Coberturas', 'Queques', 'Rellenos']);
    expect(categories.every((c) => c.system)).toBe(true);
    const queques = categories.find((c) => c.name === 'Queques');
    expect(queques?.weightProperty()?.required).toBe(true);
  });

  it('is idempotent: running again does not duplicate', async () => {
    const seed = TestBed.inject(RecipeBookSeed);
    await seed.run();
    await seed.run();
    expect(await TestBed.inject(RecipeCategoryRepository).all()).toHaveLength(3);
  });
});
