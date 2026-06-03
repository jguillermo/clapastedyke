import { EventBus } from '../../../shared/application/event-bus';
import { UseCase } from '../../../shared/application/use-case';
import { NotFoundError } from '../../../shared/domain/errors';
import { EntityId } from '../../../shared/domain/entity-id';
import { QuoteRepository } from '../../domain/quote/quote-repository';

export interface RejectQuoteRequest {
  quoteId: string;
  reason?: string;
}

/** Reject (Flow 02.2): stores the reason; neither order nor stock are touched. */
export class RejectQuote implements UseCase<RejectQuoteRequest, void> {
  constructor(
    private readonly quotes: QuoteRepository,
    private readonly bus: EventBus,
  ) {}

  async execute(request: RejectQuoteRequest): Promise<void> {
    const quote = await this.quotes.byId(EntityId.of(request.quoteId));
    if (!quote) throw new NotFoundError('Quote', request.quoteId);
    quote.reject(request.reason ?? '');
    await this.quotes.save(quote);
    await this.bus.publish(quote.pullEvents());
  }
}
