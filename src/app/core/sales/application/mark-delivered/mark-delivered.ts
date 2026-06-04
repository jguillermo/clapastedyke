import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { NotFoundError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { ORDER_REPOSITORY } from '../../domain/order/order-repository';
import { QUOTE_REPOSITORY } from '../../domain/quote/quote-repository';
import { Sale } from '../../domain/sale/sale';
import { SALE_REPOSITORY } from '../../domain/sale/sale-repository';

export interface MarkDeliveredRequest {
  orderId: string;
}

export interface MarkDeliveredResponse {
  saleId: string;
  amountSoles: number;
}

/**
 * Deliver (Flow 03.3): closes the cycle. The sale VT- is born with the FROZEN
 * final price of the originating quote.
 */
@Injectable({ providedIn: 'root' })
export class MarkDelivered implements UseCase<MarkDeliveredRequest, MarkDeliveredResponse> {
  private readonly orders = inject(ORDER_REPOSITORY);
  private readonly quotes = inject(QUOTE_REPOSITORY);
  private readonly sales = inject(SALE_REPOSITORY);
  private readonly bus = inject(EventBusToken);

  async execute(request: MarkDeliveredRequest): Promise<MarkDeliveredResponse> {
    const order = await this.orders.byId(EntityId.of(request.orderId));
    if (!order) throw new NotFoundError('Order', request.orderId);
    const quote = await this.quotes.byId(order.quoteId);
    if (!quote) throw new NotFoundError('Quote', order.quoteId.value);

    order.markDelivered(); // guard: only InProduction

    const sale = Sale.register(await this.sales.nextId(), {
      orderId: order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      amount: quote.calculation.finalPrice,
    });

    await this.orders.save(order);
    await this.sales.save(sale);
    await this.bus.publish(order.pullEvents());
    return { saleId: sale.id.value, amountSoles: sale.amount.soles };
  }
}
