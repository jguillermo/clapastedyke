import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { InformalOrder } from '../../domain/informal-order';
import { INFORMAL_ORDER_REPOSITORY } from '../../domain/repositories';

export interface AttendInformalOrderRequest {
  recipeName: string;
}

/**
 * Atiende un pedido informal llegado por la popularidad (Fase 2). Lo registra
 * y emite InformalOrderReceived (la progresión lo cuenta).
 */
@Injectable({ providedIn: 'root' })
export class AttendInformalOrder implements UseCase<AttendInformalOrderRequest, void> {
  private readonly orders = inject(INFORMAL_ORDER_REPOSITORY);
  private readonly bus = inject(EventBusToken);

  async execute({ recipeName }: AttendInformalOrderRequest): Promise<void> {
    const order = InformalOrder.receive(await this.orders.nextId(), { recipeName });
    await this.orders.save(order);
    await this.bus.publish(order.pullEvents());
  }
}
