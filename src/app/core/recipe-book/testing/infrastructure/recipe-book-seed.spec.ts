import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { makeRecipeBookFakes, makeWeightCategory } from '../recipe-book-test-doubles';
import { RecipeCategoryRepository } from '../../domain/repositories/recipe-category.repository';
import { FlavorRepository } from '../../domain/repositories/flavor.repository';
import { ConversionOptionRepository } from '../../domain/repositories/conversion-option.repository';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { RecipeCategory, SYSTEM_CATEGORY_IDS } from '../../domain/entities/recipe-category';
import { Flavor } from '../../domain/entities/flavor';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { RecipeProperty } from '../../domain/value-objects/recipe-property';
import { RecipeBookSeed } from '../../infrastructure/recipe-book-seed';
import { RecipeBookSeedDocument } from '../../infrastructure/recipe-book-seed-document';

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

  it('reconciles a stale system category: a persisted Rellenos with only Peso → canonical schema, no Peso', async () => {
    const repo = TestBed.inject(RecipeCategoryRepository);
    // BD obsoleta: Rellenos guardado por una versión anterior con una propiedad "Peso".
    await repo.save(makeWeightCategory(SYSTEM_CATEGORY_IDS.rellenos, 'Rellenos', 1));

    await TestBed.inject(RecipeBookSeed).run();

    const rellenos = (await repo.all()).find((c) => c.id.value === SYSTEM_CATEGORY_IDS.rellenos);
    expect(rellenos?.properties.map((p) => p.name)).toEqual(['Sabor', 'Porciones', 'Molde']);
    expect(rellenos?.weightProperty()).toBeUndefined();
    // No se duplica: siguen siendo las tres de sistema.
    expect(await repo.all()).toHaveLength(3);
  });

  it('preserves the chosen visibility (selectable) when reconciling an existing system category', async () => {
    const repo = TestBed.inject(RecipeCategoryRepository);
    // Queques persistido con Sabor oculto (ids canónicos).
    await repo.save(
      RecipeCategory.create(
        new EntityId(SYSTEM_CATEGORY_IDS.queques),
        'Queques',
        0,
        [
          RecipeProperty.create('prop-sabor-queques', 'Sabor', 'flavor', false, false, undefined, undefined, false),
          RecipeProperty.create('prop-porciones-queques', 'Porciones', 'options', false, false, undefined, 'portions', true),
          RecipeProperty.create('prop-molde-queques', 'Molde', 'options', false, false, undefined, 'mold', true),
        ],
        true,
      ),
    );

    await TestBed.inject(RecipeBookSeed).run();

    const queques = (await repo.all()).find((c) => c.id.value === SYSTEM_CATEGORY_IDS.queques);
    expect(queques?.property('prop-sabor-queques')?.selectable).toBe(false);
    expect(queques?.property('prop-porciones-queques')?.selectable).toBe(true);
  });

  it('leaves user-created (non-system) categories untouched', async () => {
    const repo = TestBed.inject(RecipeCategoryRepository);
    const userCat = RecipeCategory.create(
      new EntityId('user-cat-1'),
      'Galletas',
      9,
      [RecipeProperty.create('user-prop-1', 'Forma', 'text', false, false, undefined, undefined, true)],
      false,
    );
    await repo.save(userCat);

    await TestBed.inject(RecipeBookSeed).run();

    const reloaded = (await repo.all()).find((c) => c.id.value === 'user-cat-1');
    expect(reloaded?.name).toBe('Galletas');
    expect(reloaded?.properties.map((p) => p.name)).toEqual(['Forma']);
    expect(await repo.all()).toHaveLength(4); // 3 de sistema + 1 del usuario
  });
});

describe('RecipeBookSeed · contenido desde JSON', () => {
  const sampleDoc = (): RecipeBookSeedDocument => ({
    enabled: true,
    flavors: [{ id: 'flv-vainilla', label: 'Vainilla' }],
    conversionOptions: [{ id: 'co-mold-medium', group: 'mold', label: 'Molde mediano', factor: 1 }],
    ingredients: [
      { id: 'ing-harina', name: 'Harina', baseUnit: 'g', usage: 'recipe', purchasePrice: { amount: 4.5, per: { value: 1000, unit: 'g' }, currency: 'PEN' } },
      { id: 'ing-huevos', name: 'Huevos', baseUnit: 'u', usage: 'recipe', purchasePrice: { amount: 0.5, per: { value: 1, unit: 'u' }, currency: 'PEN' } },
    ],
    recipes: [
      {
        id: 'rec-bizcocho-vainilla',
        categoryId: SYSTEM_CATEGORY_IDS.queques,
        name: 'Bizcocho de Vainilla',
        values: [
          { propertyId: 'prop-sabor-queques', type: 'flavor', value: 'Vainilla' },
          { propertyId: 'prop-molde-queques', type: 'options', value: 'Molde mediano' },
        ],
        lines: [
          { ingredientId: 'ing-harina', quantity: 500 },
          { ingredientId: 'ing-huevos', quantity: 8 },
        ],
      },
    ],
  });

  const configure = (doc: RecipeBookSeedDocument | null) =>
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes(doc).providers });

  it('seeds flavors, conversion options, ingredients and recipes from the document', async () => {
    configure(sampleDoc());
    await TestBed.inject(RecipeBookSeed).run();

    expect((await TestBed.inject(FlavorRepository).all()).map((f) => f.label)).toEqual(['Vainilla']);
    expect((await TestBed.inject(ConversionOptionRepository).all()).map((o) => o.label)).toEqual(['Molde mediano']);
    const ingredients = await TestBed.inject(IngredientRepository).all();
    expect(ingredients.map((i) => i.name).sort()).toEqual(['Harina', 'Huevos']);

    const recipes = await TestBed.inject(RecipeRepository).all();
    expect(recipes).toHaveLength(1);
    const recipe = recipes[0];
    expect(recipe.name).toBe('Bizcocho de Vainilla');
    expect(recipe.categoryId.value).toBe(SYSTEM_CATEGORY_IDS.queques);
    // La línea de huevos toma la unidad base del ingrediente ('u'), no gramos.
    const huevos = recipe.lines.find((l) => l.ingredientId.value === 'ing-huevos');
    expect(huevos?.quantity.equals(Quantity.of(8, 'u'))).toBe(true);
    expect(recipe.valueOf('prop-sabor-queques')?.value).toBe('Vainilla');
  });

  it('is idempotent: running twice does not duplicate content', async () => {
    configure(sampleDoc());
    const seed = TestBed.inject(RecipeBookSeed);
    await seed.run();
    await seed.run();

    expect(await TestBed.inject(FlavorRepository).all()).toHaveLength(1);
    expect(await TestBed.inject(IngredientRepository).all()).toHaveLength(2);
    expect(await TestBed.inject(RecipeRepository).all()).toHaveLength(1);
  });

  it('never modifies an item the user already edited (create-if-absent by id)', async () => {
    configure(sampleDoc());
    // El usuario ya renombró el sabor con el mismo id que trae el seed.
    await TestBed.inject(FlavorRepository).save(Flavor.create(new EntityId('flv-vainilla'), 'Vainilla Bourbon'));

    await TestBed.inject(RecipeBookSeed).run();

    const flavors = await TestBed.inject(FlavorRepository).all();
    expect(flavors).toHaveLength(1);
    expect(flavors[0].label).toBe('Vainilla Bourbon'); // no lo pisa el seed
  });

  it('enabled:false seeds no content but still reconciles system categories', async () => {
    configure({ ...sampleDoc(), enabled: false });
    await TestBed.inject(RecipeBookSeed).run();

    expect(await TestBed.inject(FlavorRepository).all()).toHaveLength(0);
    expect(await TestBed.inject(RecipeRepository).all()).toHaveLength(0);
    expect(await TestBed.inject(RecipeCategoryRepository).all()).toHaveLength(3); // sistema
  });

  it('missing seed file (null document) does not crash and still reconciles system categories', async () => {
    configure(null);
    await TestBed.inject(RecipeBookSeed).run();

    expect(await TestBed.inject(FlavorRepository).all()).toHaveLength(0);
    expect(await TestBed.inject(RecipeCategoryRepository).all()).toHaveLength(3);
  });

  it('skips a recipe whose ingredient does not exist (no valid lines)', async () => {
    const doc: RecipeBookSeedDocument = {
      enabled: true,
      recipes: [
        {
          id: 'rec-orphan',
          categoryId: SYSTEM_CATEGORY_IDS.queques,
          name: 'Huérfana',
          lines: [{ ingredientId: 'ing-inexistente', quantity: 100 }],
        },
      ],
    };
    configure(doc);
    await TestBed.inject(RecipeBookSeed).run();

    expect(await TestBed.inject(RecipeRepository).all()).toHaveLength(0);
  });

  it('seeds ingredients with the given Peru purchase price (currency PEN)', async () => {
    configure(sampleDoc());
    await TestBed.inject(RecipeBookSeed).run();

    const harina = await TestBed.inject(IngredientRepository).byId(new EntityId('ing-harina'));
    expect(harina?.purchasePrice.equals(PurchasePrice.of(4.5, Quantity.of(1000, 'g'), 'PEN'))).toBe(true);
  });

  it('hasSeeded(): false before running, true after', async () => {
    configure(sampleDoc());
    const seed = TestBed.inject(RecipeBookSeed);
    expect(await seed.hasSeeded()).toBe(false);
    await seed.run();
    expect(await seed.hasSeeded()).toBe(true);
  });

  it('runs only once: a deleted seeded item stays deleted on the next run', async () => {
    configure(sampleDoc());
    const seed = TestBed.inject(RecipeBookSeed);
    const flavors = TestBed.inject(FlavorRepository);

    await seed.run();
    expect(await flavors.all()).toHaveLength(1);

    // El usuario borra el sabor sembrado.
    await flavors.delete(new EntityId('flv-vainilla'));
    expect(await flavors.all()).toHaveLength(0);

    // Segundo arranque: el marcador impide re-sembrar → NO reaparece.
    await seed.run();
    expect(await flavors.all()).toHaveLength(0);
  });

  it('does not re-seed on the second run (marker guards it)', async () => {
    configure(sampleDoc());
    const seed = TestBed.inject(RecipeBookSeed);
    const flavors = TestBed.inject(FlavorRepository);

    await seed.run();
    // El usuario renombra un sabor sembrado DESPUÉS del primer run.
    const seeded = (await flavors.all())[0];
    await flavors.save(seeded.relabeledTo('Vainilla editada'));

    await seed.run(); // segundo arranque: no debe volver a sembrar
    const reloaded = await flavors.byId(new EntityId('flv-vainilla'));
    expect(reloaded?.label).toBe('Vainilla editada');
    expect(await flavors.all()).toHaveLength(1);
  });

  it('enabled:false does not mark the seed as applied', async () => {
    configure({ ...sampleDoc(), enabled: false });
    const seed = TestBed.inject(RecipeBookSeed);
    await seed.run();
    expect(await seed.hasSeeded()).toBe(false);
  });

  it('re-applies when the document version is bumped (adds new content, keeps existing)', async () => {
    // Mismo módulo (mismo marcador y mismos repos) entre las dos corridas; solo cambia el doc.
    const fakes = makeRecipeBookFakes(sampleDoc());
    TestBed.configureTestingModule({ providers: fakes.providers });
    const seed = TestBed.inject(RecipeBookSeed);
    const flavors = TestBed.inject(FlavorRepository);

    await seed.run(); // version 1 → siembra Vainilla, marca aplicado v1
    expect((await flavors.all()).map((f) => f.label)).toEqual(['Vainilla']);

    // El JSON se edita: versión 2 con un sabor adicional.
    fakes.seedSource.doc = {
      ...sampleDoc(),
      version: 2,
      flavors: [
        { id: 'flv-vainilla', label: 'Vainilla' },
        { id: 'flv-chocolate', label: 'Chocolate' },
      ],
    };

    await seed.run(); // v2 > v1 → vuelve a aplicar: añade Chocolate (Vainilla ya existía)
    expect((await flavors.all()).map((f) => f.label).sort()).toEqual(['Chocolate', 'Vainilla']);
  });
});
