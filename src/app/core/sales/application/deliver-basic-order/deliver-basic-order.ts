import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { EntityId } from '../../../_common/domain/entity-id';
import { Money } from '../../../_common/domain/money';
import { NotFoundError } from '../../../_common/domain/errors';
import { Sale } from '../../domain/sale/sale';
import { SALE_REPOSITORY } from '../../domain/sale/sale-repository';
import { BASIC_ORDER_REPOSITORY } from '../../domain/basic-order/basic-order-repository';

export interface DeliverBasicOrderRequest {
  orderId: string;
}

/**
 * Entrega y cobra un pedido básico: lo marca entregado y registra la venta con
 * el precio del pedido. Emite OrderDelivered (la progresión lo cuenta como venta).
 */
@Injectable({ providedIn: 'root' })
export class DeliverBasicOrder implements UseCase<DeliverBasicOrderRequest, { saleId: string }> {
  private readonly orders = inject(BASIC_ORDER_REPOSITORY);
  private readonly sales = inject(SALE_REPOSITORY);
  private readonly bus = inject(EventBusToken);

  async execute({ orderId }: DeliverBasicOrderRequest): Promise<{ saleId: string }> {
    const order = await this.orders.byId(EntityId.of(orderId));
    if (!order) throw new NotFoundError('BasicOrder', orderId);

    order.deliver();
    await this.orders.save(order);

    const sale = Sale.register(await this.sales.nextId(), {
      orderId: order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      amount: Money.fromSoles(order.priceSoles),
    });
    await this.sales.save(sale);

    await this.bus.publish(order.pullEvents());
    return { saleId: sale.id.value };
  }
}
