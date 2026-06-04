import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { EntityId } from '../../../_common/domain/entity-id';
import { ValidationError } from '../../../_common/domain/errors';
import { domainEvent } from '../../../_common/domain/domain-event';
import { StockService } from '../../../inventory/domain/stock-service';

export interface BuyIngredientRequest {
  supplyId: string;
  quantity: number;
}

/**
 * Compra básica (Fase 1): el jugador anota la cantidad que trajo de un
 * ingrediente. Sube el stock (entrada en el kardex) y emite PurchaseRegistered
 * para que la progresión lo cuente. Sin proveedor ni precio (eso llega con
 * la función SUPPLIERS, Fase 5).
 */
@Injectable({ providedIn: 'root' })
export class BuyIngredient implements UseCase<BuyIngredientRequest, void> {
  private readonly stock = inject(StockService);
  private readonly bus = inject(EventBusToken);

  async execute({ supplyId, quantity }: BuyIngredientRequest): Promise<void> {
    if (!(quantity > 0)) throw new ValidationError('The quantity to buy must be greater than 0.');
    await this.stock.moveById(EntityId.of(supplyId), quantity, 'purchase', 'BASIC', 'Compra básica');
    await this.bus.publish([domainEvent('PurchaseRegistered', supplyId, { basic: true })]);
  }
}
