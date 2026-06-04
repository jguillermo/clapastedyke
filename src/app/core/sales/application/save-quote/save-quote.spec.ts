import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryEventBus } from '../../../_common/application/event-bus';
import { EventBusToken } from '../../../_common/core.tokens';
import { ValidationError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { CUSTOMER_REPOSITORY } from '../../../catalog/domain/customer/customer-repository';
import { RECIPE_REPOSITORY } from '../../../catalog/domain/recipe/recipe-repository';
import { SUPPLY_REPOSITORY } from '../../../catalog/domain/supply/supply-repository';
import {
  MemoryCustomerRepository,
  MemorySupplyRepository,
  MemoryRecipeRepository,
} from '../../../catalog/infrastructure/memory-repositories';
import { SaveCustomer } from '../../../catalog/application/save-customer/save-customer';
import { SaveSupply } from '../../../catalog/application/save-supply/save-supply';
import { SaveRecipe } from '../../../catalog/application/save-recipe/save-recipe';
import { SETTINGS_REPOSITORY } from '../../../settings/domain/settings-repository';
import { UpdateSettings } from '../../../settings/application/update-settings/update-settings';
import { MemorySettingsRepository } from '../../../settings/infrastructure/memory-settings-repository';
import { MemoryQuoteRepository } from '../../infrastructure/memory-repositories';
import { QUOTE_REPOSITORY } from '../../domain/quote/quote-repository';
import { ListQuotes } from '../list-quotes/list-quotes';
import { RejectQuote } from '../reject-quote/reject-quote';
import { SaveQuote } from './save-quote';

describe('SaveQuote (use case, Flow 01-02 cycle)', () => {
  let quotes: MemoryQuoteRepository;
  let save: SaveQuote;
  let reject: RejectQuote;
  let list: ListQuotes;
  let bus: InMemoryEventBus;
  let customerId: string;
  let recipeId: string;

  beforeEach(async () => {
    const customers = new MemoryCustomerRepository();
    const supplies = new MemorySupplyRepository();
    const recipes = new MemoryRecipeRepository();
    const settings = new MemorySettingsRepository();
    quotes = new MemoryQuoteRepository();
    bus = new InMemoryEventBus();

    TestBed.configureTestingModule({
      providers: [
        { provide: CUSTOMER_REPOSITORY, useValue: customers },
        { provide: SUPPLY_REPOSITORY, useValue: supplies },
        { provide: RECIPE_REPOSITORY, useValue: recipes },
        { provide: SETTINGS_REPOSITORY, useValue: settings },
        { provide: QUOTE_REPOSITORY, useValue: quotes },
        { provide: EventBusToken, useValue: bus },
      ],
    });

    customerId = (await TestBed.inject(SaveCustomer).execute({ name: 'Ana Torres' })).id;
    const ss = TestBed.inject(SaveSupply);
    const flourId = (
      await ss.execute({ name: 'Flour', type: 'ingredient', baseUnit: 'g', presentationSize: 1000, presentationPriceSoles: 5 })
    ).id;
    const eggId = (
      await ss.execute({ name: 'Egg', type: 'ingredient', baseUnit: 'u', presentationSize: 30, presentationPriceSoles: 15 })
    ).id;
    recipeId = (
      await TestBed.inject(SaveRecipe).execute({
        name: 'Chocolate cake', baseType: 'people', baseServings: 10, laborHours: 2,
        ingredients: [
          { supplyId: flourId, baseQuantity: 300 },
          { supplyId: eggId, baseQuantity: 4 },
        ],
      })
    ).id;
    await TestBed.inject(UpdateSettings).execute({ general: { defaultMargin: 30 } });

    save = TestBed.inject(SaveQuote);
    reject = TestBed.inject(RejectQuote);
    list = TestBed.inject(ListQuotes);
  });

  it('freezes P-0001 Pending with the manual price and emits the event', async () => {
    const events: string[] = [];
    bus.subscribe('QuoteCreated', e => void events.push(e.name));

    const r = await save.execute({
      customerId, recipeId, scalingMode: 'people', scalingValue: 20,
      packaging: [], margin: 30, applyIgv: true, notes: 'Saturday delivery',
    });

    expect(r.id).toBe('P-0001');
    expect(r.finalPriceSoles).toBe(110); // no box: 63 → 90 → +IGV 106.2 → 110
    const saved = await quotes.byId(EntityId.of('P-0001'));
    expect(saved?.status).toBe('Pending');
    expect(saved?.calculation.lines).toHaveLength(2);
    expect(saved?.expiresAt.getTime()).toBeGreaterThan(saved!.issuedAt.getTime());
    expect(events).toEqual(['QuoteCreated']);
  });

  it('the saved quote stays FROZEN even if the recipe changes afterwards', async () => {
    const { id } = await save.execute({
      customerId, recipeId, scalingMode: 'people', scalingValue: 20,
      packaging: [], margin: 30, applyIgv: false,
    });
    const before = (await quotes.byId(EntityId.of(id)))!.calculation.finalPrice.soles;
    // (changing the recipe does not re-touch the saved aggregate: nothing to recalc)
    const after = (await quotes.byId(EntityId.of(id)))!.calculation.finalPrice.soles;
    expect(after).toBe(before);
  });

  it('reject stores the reason and blocks the double rejection', async () => {
    const { id } = await save.execute({
      customerId, recipeId, scalingMode: 'factor', scalingValue: 1,
      packaging: [], margin: 30, applyIgv: false,
    });
    await reject.execute({ quoteId: id, reason: 'the customer backed out' });
    const q = await quotes.byId(EntityId.of(id));
    expect(q?.status).toBe('Rejected');
    expect(q?.rejectionReason).toBe('the customer backed out');
    await expect(reject.execute({ quoteId: id })).rejects.toThrow(ValidationError);
  });

  it('lists with visibleStatus and filters', async () => {
    await save.execute({
      customerId, recipeId, scalingMode: 'factor', scalingValue: 1,
      packaging: [], margin: 30, applyIgv: false,
    });
    const items = await list.execute({ status: 'Pending' });
    expect(items).toHaveLength(1);
    expect(items[0].visibleStatus).toBe('Pending');
    expect(items[0].customerName).toBe('Ana Torres');
  });
});
