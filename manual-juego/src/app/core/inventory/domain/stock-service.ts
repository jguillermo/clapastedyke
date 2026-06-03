import { EntityId } from '../../_common/domain/entity-id';
import { Supply } from '../../catalog/domain/supply/supply';
import { StockMovement, MovementType } from './stock-movement/stock-movement';
import { StockMovementRepository } from './stock-movement/stock-movement-repository';
import { SupplyRepository } from '../../catalog/domain/supply/supply-repository';

/**
 * StockService domain service: the ONLY path to change the stock
 * (equivalent to moverStock in src/Inventario.js). It applies the signed
 * quantity to the supply and leaves the movement in the kardex with the
 * resulting stock.
 */
export class StockService {
  constructor(
    private readonly supplies: SupplyRepository,
    private readonly movements: StockMovementRepository,
  ) {}

  async move(
    supply: Supply,
    signedQuantity: number,
    type: MovementType,
    reference: string,
    reason = '',
  ): Promise<StockMovement> {
    const resultingStock =
      signedQuantity >= 0
        ? supply.receiveStock(signedQuantity)
        : supply.consumeStock(-signedQuantity);

    const movement = StockMovement.register(await this.movements.nextId(), {
      supplyId: supply.id,
      supplyName: supply.name,
      type,
      quantity: signedQuantity,
      reference,
      reason,
      resultingStock,
    });

    await this.supplies.save(supply);
    await this.movements.save(movement);
    return movement;
  }

  async moveById(
    supplyId: EntityId,
    signedQuantity: number,
    type: MovementType,
    reference: string,
    reason = '',
  ): Promise<StockMovement | null> {
    const supply = await this.supplies.byId(supplyId);
    if (!supply) return null;
    return this.move(supply, signedQuantity, type, reference, reason);
  }
}
