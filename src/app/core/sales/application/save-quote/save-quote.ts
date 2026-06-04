import { EventBus } from '../../../_common/application/event-bus';
import { UseCase } from '../../../_common/application/use-case';
import { NotFoundError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { CustomerRepository } from '../../../catalog/domain/customer/customer-repository';
import { SupplyRepository } from '../../../catalog/domain/supply/supply-repository';
import { RecipeRepository } from '../../../catalog/domain/recipe/recipe-repository';
import { SettingsRepository } from '../../../settings/domain/settings-repository';
import { Quote } from '../../domain/quote/quote';
import { QuoteRepository } from '../../domain/quote/quote-repository';
import {
  CalculateQuoteRequest,
  calculateWithCatalog,
} from '../calculate-quote/calculate-quote';

export interface SaveQuoteRequest extends CalculateQuoteRequest {
  customerId: string;
  notes?: string;
}

export interface SaveQuoteResponse {
  id: string;
  finalPriceSoles: number;
}

/**
 * Saves the FROZEN estimate (Flow 01): recalculates with today's prices and
 * fixes them forever in the aggregate. It is born Pending, expiring after the
 * settings days. It does not touch inventory yet.
 */
export class SaveQuote implements UseCase<SaveQuoteRequest, SaveQuoteResponse> {
  constructor(
    private readonly quotes: QuoteRepository,
    private readonly customers: CustomerRepository,
    private readonly recipes: RecipeRepository,
    private readonly supplies: SupplyRepository,
    private readonly settings: SettingsRepository,
    private readonly bus: EventBus,
  ) {}

  async execute(request: SaveQuoteRequest): Promise<SaveQuoteResponse> {
    const customer = await this.customers.byId(EntityId.of(request.customerId));
    if (!customer) throw new NotFoundError('Customer', request.customerId);

    const { recipe, calculation } = await calculateWithCatalog(
      this.recipes,
      this.supplies,
      this.settings,
      request,
    );
    const settings = await this.settings.get();

    const quote = Quote.create(await this.quotes.nextId(), {
      customerId: customer.id,
      customerName: customer.name,
      recipeId: recipe.id,
      recipeName: recipe.name,
      scalingMode: request.scalingMode,
      scalingValue: request.scalingValue ?? 0,
      calculation,
      notes: request.notes,
      expiryDays: settings.general.quoteExpiryDays,
    });

    await this.quotes.save(quote);
    await this.bus.publish(quote.pullEvents());
    return { id: quote.id.value, finalPriceSoles: calculation.finalPrice.soles };
  }
}
