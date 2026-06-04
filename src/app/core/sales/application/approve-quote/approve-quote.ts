import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { NotFoundError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { SUPPLY_REPOSITORY } from '../../../catalog/domain/supply/supply-repository';
import { SETTINGS_REPOSITORY } from '../../../settings/domain/settings-repository';
import { StockService } from '../../../inventory/domain/stock-service';
import { Order, OrderRequirement } from '../../domain/order/order';
import { ORDER_REPOSITORY } from '../../domain/order/order-repository';
import { QUOTE_REPOSITORY } from '../../domain/quote/quote-repository';
import { deductOrderStock } from '../order-stock-deduction';

export interface ApproveQuoteRequest {
  quoteId: string;
}

export interface ApproveQuoteResponse {
  orderId: string;
  /** Supplies that will fall short (informative warning: it does not block). */
  shortages: OrderRequirement[];
}

/**
 * Approve (Flow 02): the deal closes. The order PD- is born with its
 * requirements (required and shortage = today's snapshot) and, if settings say
 * ON_APPROVAL, stock goes down already with 'consumption' movements.
 */
@Injectable({ providedIn: 'root' })
export class ApproveQuote implements UseCase<ApproveQuoteRequest, ApproveQuoteResponse> {
  private readonly quotes = inject(QUOTE_REPOSITORY);
  private readonly orders = inject(ORDER_REPOSITORY);
  private readonly supplies = inject(SUPPLY_REPOSITORY);
  private readonly stock = inject(StockService);
  private readonly settings = inject(SETTINGS_REPOSITORY);
  private readonly bus = inject(EventBusToken);

  async execute(request: ApproveQuoteRequest): Promise<ApproveQuoteResponse> {
    const quote = await this.quotes.byId(EntityId.of(request.quoteId));
    if (!quote) throw new NotFoundError('Quote', request.quoteId);

    // Requirements: the frozen lines grouped per supply,
    // with the shortage computed against TODAY's stock (snapshot).
    const required = new Map<string, { name: string; quantity: number }>();
    for (const line of quote.calculation.lines) {
      const current = required.get(line.supplyId) ?? { name: line.name, quantity: 0 };
      current.quantity += line.quantity;
      required.set(line.supplyId, current);
    }
    const requirements: OrderRequirement[] = [];
    for (const [supplyId, req] of required) {
      const supply = await this.supplies.byId(EntityId.of(supplyId));
      const currentStock = supply?.stock ?? 0;
      requirements.push({
        supplyId,
        supplyName: req.name,
        requiredQuantity: req.quantity,
        shortage: Math.max(0, req.quantity - currentStock),
      });
    }

    const order = Order.create(await this.orders.nextId(), {
      quoteId: quote.id,
      customerId: quote.customerId,
      customerName: quote.customerName,
      recipeName: quote.recipeName,
      requirements,
    });

    quote.approve(order.id); // guard: only Pending

    const settings = await this.settings.get();
    await this.orders.save(order);
    if (settings.general.stockDeductionMoment === 'ON_APPROVAL') {
      await deductOrderStock(order, this.stock, this.orders);
    }
    await this.quotes.save(quote);

    await this.bus.publish([...quote.pullEvents(), ...order.pullEvents()]);
    return {
      orderId: order.id.value,
      shortages: requirements.filter(r => r.shortage > 0),
    };
  }
}
