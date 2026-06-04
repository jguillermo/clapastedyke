import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { NotFoundError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { QUOTE_REPOSITORY } from '../../domain/quote/quote-repository';

export interface RejectQuoteRequest {
  quoteId: string;
  reason?: string;
}

/** Reject (Flow 02.2): stores the reason; neither order nor stock are touched. */
@Injectable({ providedIn: 'root' })
export class RejectQuote implements UseCase<RejectQuoteRequest, void> {
  private readonly quotes = inject(QUOTE_REPOSITORY);
  private readonly bus = inject(EventBusToken);

  async execute(request: RejectQuoteRequest): Promise<void> {
    const quote = await this.quotes.byId(EntityId.of(request.quoteId));
    if (!quote) throw new NotFoundError('Quote', request.quoteId);
    quote.reject(request.reason ?? '');
    await this.quotes.save(quote);
    await this.bus.publish(quote.pullEvents());
  }
}
