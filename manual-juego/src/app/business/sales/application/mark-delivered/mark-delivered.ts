import { EventBus } from '../../../shared/application/event-bus';
import { UseCase } from '../../../shared/application/use-case';
import { NotFoundError } from '../../../shared/domain/errors';
import { EntityId } from '../../../shared/domain/entity-id';
import { OrderRepository } from '../../domain/order/order-repository';
import { QuoteRepository } from '../../domain/quote/quote-repository';
import { Sale } from '../../domain/sale/sale';
import { SaleRepository } from '../../domain/sale/sale-repository';

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
export class MarkDelivered implements UseCase<MarkDeliveredRequest, MarkDeliveredResponse> {
  constructor(
    private readonly orders: OrderRepository,
    private readonly quotes: QuoteRepository,
    private readonly sales: SaleRepository,
    private readonly bus: EventBus,
  ) {}

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
