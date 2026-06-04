import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryEventBus } from '../../_common/application/event-bus';
import { EventBusToken } from '../../_common/core.tokens';
import { ValidationError } from '../../_common/domain/errors';
import { EntityId } from '../../_common/domain/entity-id';
import { StockStatus } from '../../catalog/domain/supply/supply';
import { SUPPLY_REPOSITORY } from '../../catalog/domain/supply/supply-repository';
import { RECIPE_REPOSITORY } from '../../catalog/domain/recipe/recipe-repository';
import { SaveSupply } from '../../catalog/application/save-supply/save-supply';
import { SaveRecipe } from '../../catalog/application/save-recipe/save-recipe';
import { MemoryRecipeRepository, MemorySupplyRepository } from '../../catalog/infrastructure/memory-repositories';
import { STOCK_MOVEMENT_REPOSITORY } from '../../inventory/domain/stock-movement/stock-movement-repository';
import { MemoryStockMovementRepository } from '../../inventory/infrastructure/memory-repositories';
import { StockService } from '../../inventory/domain/stock-service';
import { PRODUCTION_REPOSITORY } from '../domain/production/production-repository';
import { MemoryProductionRepository } from '../infrastructure/memory-production-repository';
import { CheckIngredients } from './check-ingredients/check-ingredients';
import { CookRecipe } from './cook-recipe/cook-recipe';

describe('Kitchen (Fase 1: revisar y cocinar)', () => {
  let supplies: MemorySupplyRepository;
  let recipes: MemoryRecipeRepository;
  let movements: MemoryStockMovementRepository;
  let productions: MemoryProductionRepository;
  let bus: InMemoryEventBus;
  let check: CheckIngredients;
  let cook: CookRecipe;
  let stock: StockService;
  let flourId: string;
  let eggId: string;
  let recipeId: string;

  beforeEach(async () => {
    supplies = new MemorySupplyRepository();
    recipes = new MemoryRecipeRepository();
    movements = new MemoryStockMovementRepository();
    productions = new MemoryProductionRepository();
    bus = new InMemoryEventBus();

    TestBed.configureTestingModule({
      providers: [
        { provide: SUPPLY_REPOSITORY, useValue: supplies },
        { provide: RECIPE_REPOSITORY, useValue: recipes },
        { provide: STOCK_MOVEMENT_REPOSITORY, useValue: movements },
        { provide: PRODUCTION_REPOSITORY, useValue: productions },
        { provide: EventBusToken, useValue: bus },
      ],
    });

    const ss = TestBed.inject(SaveSupply);
    // Modo básico: nombre + stock; precio 0, presentación 1 (campos ocultos).
    flourId = (
      await ss.execute({
        name: 'Harina', type: 'ingredient', baseUnit: 'g',
        presentationSize: 1, presentationPriceSoles: 0, initialStock: 0,
      })
    ).id;
    eggId = (
      await ss.execute({
        name: 'Huevo', type: 'ingredient', baseUnit: 'u',
        presentationSize: 1, presentationPriceSoles: 0, initialStock: 5,
      })
    ).id;
    recipeId = (
      await TestBed.inject(SaveRecipe).execute({
        name: 'Galletas', baseType: 'people', baseServings: 1, laborHours: 0,
        ingredients: [
          { supplyId: flourId, baseQuantity: 200 },
          { supplyId: eggId, baseQuantity: 3 },
        ],
      })
    ).id;

    check = TestBed.inject(CheckIngredients);
    cook = TestBed.inject(CookRecipe);
    stock = TestBed.inject(StockService);
  });

  it('CheckIngredients detecta el faltante (harina agotada)', async () => {
    const review = await check.execute({ recipeId });
    expect(review.canCook).toBe(false);
    const flour = review.items.find(i => i.supplyId === flourId)!;
    const egg = review.items.find(i => i.supplyId === eggId)!;
    expect(flour.status).toBe(StockStatus.EMPTY);
    expect(flour.needed).toBe(200);
    expect(egg.status).toBe(StockStatus.OK);
  });

  it('cocinar sin ingredientes suficientes se rechaza', async () => {
    await expect(cook.execute({ recipeId })).rejects.toThrow(ValidationError);
  });

  it('tras comprar, se puede cocinar: descuenta stock y emite RecipeCooked', async () => {
    // "Comprar" harina (entrada de stock).
    await stock.moveById(EntityId.of(flourId), 500, 'purchase', 'TEST');
    expect((await check.execute({ recipeId })).canCook).toBe(true);

    const events: string[] = [];
    bus.subscribe('RecipeCooked', e => void events.push(e.name));

    const { productionId } = await cook.execute({ recipeId });
    expect(productionId).toBe('PRD-0001');
    expect(events).toContain('RecipeCooked');

    const flour = await supplies.byId(EntityId.of(flourId));
    const egg = await supplies.byId(EntityId.of(eggId));
    expect(flour?.stock).toBe(300); // 500 − 200
    expect(egg?.stock).toBe(2); // 5 − 3
    expect(await productions.all()).toHaveLength(1);
  });
});
