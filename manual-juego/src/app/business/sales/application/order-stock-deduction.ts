import { EntityId } from '../../shared/domain/entity-id';
import { StockService } from '../../inventory/domain/stock-service';
import { Order } from '../domain/order/order';
import { OrderRepository } from '../domain/order/order-repository';

/**
 * Deducts the stock of an order's requirements ('consumption' movements),
 * ONCE (idempotent via order.markStockDeducted). Invoked by ApproveQuote
 * (ON_APPROVAL moment) or StartProduction (ON_PRODUCTION moment) —
 * descontarPedidoSiHaceFalta in the GAS.
 */
export async function deductOrderStock(
  order: Order,
  stockService: StockService,
  orderRepository: OrderRepository,
): Promise<void> {
  if (!order.markStockDeducted()) return; // already deducted

  for (const req of order.requirements) {
    await stockService.moveById(
      EntityId.of(req.supplyId),
      -req.requiredQuantity,
      'consumption',
      order.id.value,
      `Consumption for order ${order.id.value}`,
    );
  }
  await orderRepository.save(order);
}
