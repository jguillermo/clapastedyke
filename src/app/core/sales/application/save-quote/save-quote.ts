import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { NotFoundError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { CUSTOMER_REPOSITORY } from '../../../catalog/domain/customer/customer-repository';
import { SUPPLY_REPOSITORY } from '../../../catalog/domain/supply/supply-repository';
import { RECIPE_REPOSITORY } from '../../../catalog/domain/recipe/recipe-repository';
import { SETTINGS_REPOSITORY } from '../../../settings/domain/settings-repository';
import { Quote } from '../../domain/quote/quote';
import { QUOTE_REPOSITORY } from '../../domain/quote/quote-repository';
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
@Injectable({ providedIn: 'root' })
export class SaveQuote implements UseCase<SaveQuoteRequest, SaveQuoteResponse> {
  private readonly quotes = inject(QUOTE_REPOSITORY);
  private readonly customers = inject(CUSTOMER_REPOSITORY);
  private readonly recipes = inject(RECIPE_REPOSITORY);
  private readonly supplies = inject(SUPPLY_REPOSITORY);
  private readonly settings = inject(SETTINGS_REPOSITORY);
  private readonly bus = inject(EventBusToken);

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
