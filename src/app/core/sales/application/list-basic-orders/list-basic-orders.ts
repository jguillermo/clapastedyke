import { Injectable, inject } from '@angular/core';
import { UseCase } from '../../../_common/application/use-case';
import { BasicOrderPrimitives } from '../../domain/basic-order/basic-order';
import { BASIC_ORDER_REPOSITORY } from '../../domain/basic-order/basic-order-repository';

/** Lista de pedidos básicos para la UI (recientes primero). */
@Injectable({ providedIn: 'root' })
export class ListBasicOrders implements UseCase<void, BasicOrderPrimitives[]> {
  private readonly orders = inject(BASIC_ORDER_REPOSITORY);

  async execute(): Promise<BasicOrderPrimitives[]> {
    const all = await this.orders.all();
    return all.map(o => o.toPrimitives()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
