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
    // Todas cargan el mismo esquema (Sabor, Porciones, Molde). Ninguna tiene Peso.
    for (const c of categories) {
      expect(c.properties.map((p) => p.name)).toEqual(['Sabor', 'Porciones', 'Molde']);
      expect(c.weightProperty()).toBeUndefined();
    }
    // Por defecto oculto, salvo Queques (visible).
    const queques = categories.find((c) => c.name === 'Queques');
    const rellenos = categories.find((c) => c.name === 'Rellenos');
    expect(queques?.properties.every((p) => p.selectable)).toBe(true);
    expect(rellenos?.properties.every((p) => !p.selectable)).toBe(true);
  });

  it('is idempotent: running again does not duplicate', async () => {
    const seed = TestBed.inject(RecipeBookSeed);
    await seed.run();
    await seed.run();
    expect(await TestBed.inject(RecipeCategoryRepository).all()).toHaveLength(3);
  });
});
