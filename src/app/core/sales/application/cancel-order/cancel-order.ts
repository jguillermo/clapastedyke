import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { NotFoundError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { STOCK_MOVEMENT_REPOSITORY } from '../../../inventory/domain/stock-movement/stock-movement-repository';
import { StockService } from '../../../inventory/domain/stock-service';
import { ORDER_REPOSITORY } from '../../domain/order/order-repository';

export interface CancelOrderRequest {
  orderId: string;
  reason?: string;
}

/**
 * Cancel (Flow 03.4): the consumed stock IS RETURNED IN FULL — reverts each
 * 'consumption' movement of the order with a 'cancellation' one. A Delivered
 * order cannot be cancelled (aggregate guard).
 */
@Injectable({ providedIn: 'root' })
export class CancelOrder implements UseCase<CancelOrderRequest, void> {
  private readonly orders = inject(ORDER_REPOSITORY);
  private readonly movements = inject(STOCK_MOVEMENT_REPOSITORY);
  private readonly stock = inject(StockService);
  private readonly bus = inject(EventBusToken);

  async execute(request: CancelOrderRequest): Promise<void> {
    const order = await this.orders.byId(EntityId.of(request.orderId));
    if (!order) throw new NotFoundError('Order', request.orderId);

    order.cancel(request.reason ?? '');

    // Reversal: one 'cancellation' (+) for each 'consumption' (−) of the order
    const consumptions = await this.movements.byReferenceAndType(order.id.value, 'consumption');
    for (const consumption of consumptions) {
      await this.stock.moveById(
        consumption.supplyId,
        -consumption.quantity, // the consumption is negative → this adds
        'cancellation',
        order.id.value,
        `Cancellation for order ${order.id.value}`,
      );
    }

    await this.orders.save(order);
    await this.bus.publish(order.pullEvents());
  }
}
