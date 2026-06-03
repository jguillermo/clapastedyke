import { UseCase } from '../../../shared/application/use-case';
import { formatDate } from '../../../shared/application/formats';
import { Money } from '../../../shared/domain/money';
import { QuotePrimitives, VisibleQuoteStatus } from '../../domain/quote/quote';
import { QuoteRepository } from '../../domain/quote/quote-repository';

export interface QuoteListItem extends QuotePrimitives {
  /** What the list shows: a Pending quote past its date appears «Expired». */
  visibleStatus: VisibleQuoteStatus;
  finalPriceFormatted: string;
  issuedAtFormatted: string;
  expiresAtFormatted: string;
}

export interface ListQuotesRequest {
  status?: VisibleQuoteStatus;
  customerId?: string;
}

export class ListQuotes implements UseCase<ListQuotesRequest, QuoteListItem[]> {
  constructor(private readonly quotes: QuoteRepository) {}

  async execute(request: ListQuotesRequest = {}): Promise<QuoteListItem[]> {
    const today = new Date();
    let list = (await this.quotes.all()).map(q => {
      const primitives = q.toPrimitives();
      return {
        ...primitives,
        visibleStatus: q.visibleStatus(today),
        finalPriceFormatted: Money.fromSoles(primitives.finalPriceSoles).format(),
        issuedAtFormatted: formatDate(primitives.issuedAt),
        expiresAtFormatted: formatDate(primitives.expiresAt),
      };
    });
    if (request.status) list = list.filter(q => q.visibleStatus === request.status);
    if (request.customerId) list = list.filter(q => q.customerId === request.customerId);
    // Newest first, like the GAS list.
    return list.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }
}
