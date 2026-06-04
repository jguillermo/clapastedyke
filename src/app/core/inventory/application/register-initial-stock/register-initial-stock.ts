import { Injectable, inject } from '@angular/core';
import { DomainEvent } from '../../../_common/domain/domain-event';
import { EntityId } from '../../../_common/domain/entity-id';
import { StockMovement } from '../../domain/stock-movement/stock-movement';
import { STOCK_MOVEMENT_REPOSITORY } from '../../domain/stock-movement/stock-movement-repository';

/**
 * Subscriber for SupplyCreated: if the creation brings initial stock, it
 * leaves the 'initial' movement in the kardex (the supply's stock is already
 * set by the aggregate — here we only record the fact, as the GAS does).
 */
@Injectable({ providedIn: 'root' })
export class RegisterInitialStock {
  private readonly movements = inject(STOCK_MOVEMENT_REPOSITORY);

  /** Wire it like: bus.subscribe('SupplyCreated', e => subscriber.handle(e)) */
  async handle(event: DomainEvent): Promise<void> {
    const initialStock = Number(event.data['initialStock'] ?? 0);
    if (!(initialStock > 0)) return;

    const movement = StockMovement.register(await this.movements.nextId(), {
      supplyId: EntityId.of(event.aggregateId),
      supplyName: String(event.data['name'] ?? ''),
      type: 'initial',
      quantity: initialStock,
      reference: event.aggregateId,
      reason: 'Initial stock on creation',
      resultingStock: initialStock,
    });
    await this.movements.save(movement);
  }
}
