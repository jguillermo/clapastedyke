import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { NotFoundError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { StockService } from '../../../inventory/domain/stock-service';
import { ORDER_REPOSITORY } from '../../domain/order/order-repository';
import { deductOrderStock } from '../order-stock-deduction';

export interface StartProductionRequest {
  orderId: string;
}

/**
 * Start production (Flow 03.2). Ensures the stock deduction if settings were
 * ON_PRODUCTION (idempotent: if it already went down on approval, it does not
 * go down again).
 */
@Injectable({ providedIn: 'root' })
export class StartProduction implements UseCase<StartProductionRequest, void> {
  private readonly orders = inject(ORDER_REPOSITORY);
  private readonly stock = inject(StockService);
  private readonly bus = inject(EventBusToken);

  async execute(request: StartProductionRequest): Promise<void> {
    const order = await this.orders.byId(EntityId.of(request.orderId));
    if (!order) throw new NotFoundError('Order', request.orderId);

    order.startProduction();
    await deductOrderStock(order, this.stock, this.orders);
    await this.orders.save(order);
    await this.bus.publish(order.pullEvents());
  }
}
