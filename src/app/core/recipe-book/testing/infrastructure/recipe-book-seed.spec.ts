import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { makeRecipeBookFakes, makeCategory } from '../recipe-book-test-doubles';
import { RecipeCategoryRepository } from '../../domain/repositories/recipe-category.repository';
import { RecipeFlavorRepository } from '../../domain/repositories/recipe-flavor.repository';
import { RecipeCapacityRepository } from '../../domain/repositories/recipe-capacity.repository';
import { SupplyRepository } from '../../domain/repositories/supply.repository';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { RecipeFlavor } from '../../domain/entities/recipe-flavor';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { RecipeBookSeed } from '../../infrastructure/seed/recipe-book-seed';
import { RecipeBookSeedDocument } from '../../infrastructure/seed/recipe-book-seed-document';

describe('RecipeBookSeed · categorías', () => {
  const doc = (): RecipeBookSeedDocument => ({
    enabled: true,
    categories: [
      { id: 'sys-queques', name: 'Queques' },
      { id: 'sys-rellenos', name: 'Rellenos' },
      { id: 'sys-coberturas', name: 'Coberturas' },
    ],
  });

  const configure = (d: RecipeBookSeedDocument | null) =>
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes(d).providers });

  it('seeds the categories from the document (id + name)', async () => {
    configure(doc());
    await TestBed.inject(RecipeBookSeed).run();
    const categories = await TestBed.inject(RecipeCategoryRepository).all();
    expect(categories.map((c) => c.name).sort()).toEqual(['Coberturas', 'Queques', 'Rellenos']);
  });

  it('NO siembra si este navegador ya tuvo cuenta: su catálogo está en su hoja', async () => {
    // Sin esto, los datos de ejemplo no solo ensucian la app: viajan a la hoja en el primer ciclo.
    const fakes = makeRecipeBookFakes(doc());
    fakes.accountHistory.connected = true;
    TestBed.configureTestingModule({ providers: fakes.providers });

    await TestBed.inject(RecipeBookSeed).run();

    expect(await TestBed.inject(RecipeCategoryRepository).all()).toEqual([]);
  });

  it('no marca nada como sembrado si no sembró: al desconectarse podrá sembrar', async () => {
    const fakes = makeRecipeBookFakes(doc());
    fakes.accountHistory.connected = true;
    TestBed.configureTestingModule({ providers: fakes.providers });
    const seed = TestBed.inject(RecipeBookSeed);

    await seed.run();

    expect(await seed.hasSeeded()).toBe(false);
  });

  it('is idempotent: running again does not duplicate', async () => {
    configure(doc());
    const seed = TestBed.inject(RecipeBookSeed);
    await seed.run();
    await seed.run();
    expect(await TestBed.inject(RecipeCategoryRepository).all()).toHaveLength(3);
  });

  it('create-if-absent: never overwrites a category the user already renamed (same id)', async () => {
    configure(doc());
    const repo = TestBed.inject(RecipeCategoryRepository);
    await repo.save(makeCategory('sys-queques', 'Mis Queques'));

    await TestBed.inject(RecipeBookSeed).run();

    const queques = (await repo.all()).find((c) => c.id.value === 'sys-queques');
    expect(queques?.name).toBe('Mis Queques'); // no lo pisa el seed
    expect(await repo.all()).toHaveLength(3);
  });

  it('enabled:false seeds nothing', async () => {
    configure({ ...doc(), enabled: false });
    await TestBed.inject(RecipeBookSeed).run();
    expect(await TestBed.inject(RecipeCategoryRepository).all()).toHaveLength(0);
  });

  it('missing seed file (null document) does not crash and seeds nothing', async () => {
    configure(null);
    await TestBed.inject(RecipeBookSeed).run();
    expect(await TestBed.inject(RecipeCategoryRepository).all()).toHaveLength(0);
  });
});

describe('RecipeBookSeed · contenido desde JSON', () => {
  const sampleDoc = (): RecipeBookSeedDocument => ({
    enabled: true,
    categories: [{ id: 'sys-queques', name: 'Queques' }],
    flavors: [{ id: 'flv-vainilla', label: 'Vainilla' }],
    recipeCapacities: [{ id: 'co-mold-medium', group: 'mold', label: 'Molde mediano', factor: 1 }],
    supplies: [
      {
        id: 'ing-harina',
        name: 'Harina',
        baseUnit: 'g',
        usage: 'recipe',
        purchasePrice: { amount: 4.5, per: { value: 1000, unit: 'g' }, currency: 'PEN' },
      },
      {
        id: 'ing-huevos',
        name: 'Huevos',
        baseUnit: 'u',
        usage: 'recipe',
        purchasePrice: { amount: 0.5, per: { value: 1, unit: 'u' }, currency: 'PEN' },
      },
    ],
    recipes: [
      {
        id: 'rec-bizcocho-vainilla',
        categoryId: 'sys-queques',
        name: 'Bizcocho de Vainilla',
        lines: [
          { supplyId: 'ing-harina', quantity: 500 },
          { supplyId: 'ing-huevos', quantity: 8 },
        ],
      },
    ],
  });

  const configure = (doc: RecipeBookSeedDocument | null) =>
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes(doc).providers });

  it('seeds flavors, conversion options, categories, ingredients and recipes from the document', async () => {
    configure(sampleDoc());
    await TestBed.inject(RecipeBookSeed).run();

    expect((await TestBed.inject(RecipeFlavorRepository).all()).map((f) => f.label)).toEqual([
      'Vainilla',
    ]);
    expect((await TestBed.inject(RecipeCapacityRepository).all()).map((o) => o.label)).toEqual([
      'Molde mediano',
    ]);
    expect((await TestBed.inject(RecipeCategoryRepository).all()).map((c) => c.name)).toEqual([
      'Queques',
    ]);
    const ingredients = await TestBed.inject(SupplyRepository).all();
    expect(ingredients.map((i) => i.name).sort()).toEqual(['Harina', 'Huevos']);

    const recipes = await TestBed.inject(RecipeRepository).all();
    expect(recipes).toHaveLength(1);
    const recipe = recipes[0];
    expect(recipe.name).toBe('Bizcocho de Vainilla');
    expect(recipe.categoryId.value).toBe('sys-queques');
    // La línea de huevos toma la unidad base del ingrediente ('u'), no gramos.
    const huevos = recipe.ingredients.find((l) => l.supplyId.value === 'ing-huevos');
    expect(huevos?.quantity.equals(Quantity.of(8, 'u'))).toBe(true);
  });

  it('is idempotent: running twice does not duplicate content', async () => {
    configure(sampleDoc());
    const seed = TestBed.inject(RecipeBookSeed);
    await seed.run();
    await seed.run();

    expect(await TestBed.inject(RecipeFlavorRepository).all()).toHaveLength(1);
    expect(await TestBed.inject(SupplyRepository).all()).toHaveLength(2);
    expect(await TestBed.inject(RecipeRepository).all()).toHaveLength(1);
  });

  it('never modifies an item the user already edited (create-if-absent by id)', async () => {
    configure(sampleDoc());
    // El usuario ya renombró el sabor con el mismo id que trae el seed.
    await TestBed.inject(RecipeFlavorRepository).save(
      RecipeFlavor.create(new EntityId('flv-vainilla'), 'Vainilla Bourbon'),
    );

    await TestBed.inject(RecipeBookSeed).run();

    const flavors = await TestBed.inject(RecipeFlavorRepository).all();
    expect(flavors).toHaveLength(1);
    expect(flavors[0].label).toBe('Vainilla Bourbon'); // no lo pisa el seed
  });

  it('enabled:false seeds no content', async () => {
    configure({ ...sampleDoc(), enabled: false });
    await TestBed.inject(RecipeBookSeed).run();

    expect(await TestBed.inject(RecipeFlavorRepository).all()).toHaveLength(0);
    expect(await TestBed.inject(RecipeRepository).all()).toHaveLength(0);
    expect(await TestBed.inject(RecipeCategoryRepository).all()).toHaveLength(0);
  });

  it('missing seed file (null document) does not crash and seeds nothing', async () => {
    configure(null);
    await TestBed.inject(RecipeBookSeed).run();

    expect(await TestBed.inject(RecipeFlavorRepository).all()).toHaveLength(0);
    expect(await TestBed.inject(RecipeCategoryRepository).all()).toHaveLength(0);
  });

  it('skips a recipe whose ingredient does not exist (no valid lines)', async () => {
    const doc: RecipeBookSeedDocument = {
      enabled: true,
      categories: [{ id: 'sys-queques', name: 'Queques' }],
      recipes: [
        {
          id: 'rec-orphan',
          categoryId: 'sys-queques',
          name: 'Huérfana',
          lines: [{ supplyId: 'ing-inexistente', quantity: 100 }],
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

    const harina = await TestBed.inject(SupplyRepository).byId(new EntityId('ing-harina'));
    expect(harina?.purchasePrice.equals(PurchasePrice.of(4.5, Quantity.of(1000, 'g'), 'PEN'))).toBe(
      true,
    );
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
    const flavors = TestBed.inject(RecipeFlavorRepository);

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
    const flavors = TestBed.inject(RecipeFlavorRepository);

    await seed.run();
    // El usuario renombra un sabor sembrado DESPUÉS del primer run.
    const seeded = (await flavors.all())[0];
    await flavors.save(RecipeFlavor.create(seeded.id, 'Vainilla editada'));

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
    const flavors = TestBed.inject(RecipeFlavorRepository);

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
