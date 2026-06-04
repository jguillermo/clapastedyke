import { Injectable, inject } from '@angular/core';
import { UseCase } from '../../../_common/application/use-case';
import { formatDate } from '../../../_common/application/formats';
import { OrderPrimitives, OrderStatus } from '../../domain/order/order';
import { ORDER_REPOSITORY } from '../../domain/order/order-repository';

export interface ListOrdersRequest {
  status?: OrderStatus;
  customerId?: string;
}

export interface OrderListItem extends OrderPrimitives {
  createdAtFormatted: string;
  deliveredAtFormatted: string; // '—' if not delivered yet
}

@Injectable({ providedIn: 'root' })
export class ListOrders implements UseCase<ListOrdersRequest, OrderListItem[]> {
  private readonly orders = inject(ORDER_REPOSITORY);

  async execute(request: ListOrdersRequest = {}): Promise<OrderListItem[]> {
    let list = (await this.orders.all()).map(o => {
      const primitives = o.toPrimitives();
      return {
        ...primitives,
        createdAtFormatted: formatDate(primitives.createdAt),
        deliveredAtFormatted: formatDate(primitives.deliveredAt),
      };
    });
    if (request.status) list = list.filter(o => o.status === request.status);
    if (request.customerId) list = list.filter(o => o.customerId === request.customerId);
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
