import { EventBus } from '../../../shared/application/event-bus';
import { UseCase } from '../../../shared/application/use-case';
import { NotFoundError } from '../../../shared/domain/errors';
import { EntityId } from '../../../shared/domain/entity-id';
import { StockService } from '../../../inventory/domain/stock-service';
import { OrderRepository } from '../../domain/order/order-repository';
import { deductOrderStock } from '../order-stock-deduction';

export interface StartProductionRequest {
  orderId: string;
}

/**
 * Start production (Flow 03.2). Ensures the stock deduction if settings were
 * ON_PRODUCTION (idempotent: if it already went down on approval, it does not
 * go down again).
 */
export class StartProduction implements UseCase<StartProductionRequest, void> {
  constructor(
    private readonly orders: OrderRepository,
    private readonly stock: StockService,
    private readonly bus: EventBus,
  ) {}

  async execute(request: StartProductionRequest): Promise<void> {
    const order = await this.orders.byId(EntityId.of(request.orderId));
    if (!order) throw new NotFoundError('Order', request.orderId);

    order.startProduction();
    await deductOrderStock(order, this.stock, this.orders);
    await this.orders.save(order);
    await this.bus.publish(order.pullEvents());
  }
}
