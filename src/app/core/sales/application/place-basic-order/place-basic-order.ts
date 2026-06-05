import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { EntityId } from '../../../_common/domain/entity-id';
import { BasicOrder } from '../../domain/basic-order/basic-order';
import { BASIC_ORDER_REPOSITORY } from '../../domain/basic-order/basic-order-repository';

export interface PlaceBasicOrderRequest {
  customerId: string;
  customerName: string;
  recipeId: string;
  recipeName: string;
  priceSoles: number;
}

/** Crea un pedido básico (Fase 3): cliente + receta + precio a mano. */
@Injectable({ providedIn: 'root' })
export class PlaceBasicOrder implements UseCase<PlaceBasicOrderRequest, { orderId: string }> {
  private readonly orders = inject(BASIC_ORDER_REPOSITORY);
  private readonly bus = inject(EventBusToken);

  async execute(request: PlaceBasicOrderRequest): Promise<{ orderId: string }> {
    const order = BasicOrder.place(await this.orders.nextId(), {
      customerId: EntityId.of(request.customerId),
      customerName: request.customerName,
      recipeId: request.recipeId,
      recipeName: request.recipeName,
      priceSoles: request.priceSoles,
    });
    await this.orders.save(order);
    await this.bus.publish(order.pullEvents());
    return { orderId: order.id.value };
  }
}
