import { ValidationError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';

/**
 * Kardex movement types (src/Inventario.js · moverStock):
 * automatic ('initial', 'purchase', 'consumption', 'cancellation') and manual
 * (the settings adjustment types: waste, damage, expiry, count, return). The
 * sign of the quantity indicates inflow (+) or outflow (−).
 */
export type MovementType =
  | 'initial'
  | 'purchase'
  | 'consumption'
  | 'cancellation'
  | (string & {});

export interface StockMovementPrimitives {
  id: string;
  date: string; // ISO
  supplyId: string;
  supplyName: string;
  type: MovementType;
  quantity: number; // signed
  reference: string; // document that motivates it (PD-, CMP-, IN-…)
  reason: string;
  resultingStock: number;
}

/**
 * StockMovement (MV-): IMMUTABLE kardex record. Every stock change leaves
 * exactly one — so you can always trace why the inventory stands as it does.
 */
export class StockMovement {
  private constructor(
    readonly id: EntityId,
    readonly date: Date,
    readonly supplyId: EntityId,
    readonly supplyName: string,
    readonly type: MovementType,
    readonly quantity: number,
    readonly reference: string,
    readonly reason: string,
    readonly resultingStock: number,
  ) {}

  static register(
    id: EntityId,
    data: {
      supplyId: EntityId;
      supplyName: string;
      type: MovementType;
      quantity: number;
      reference: string;
      reason?: string;
      resultingStock: number;
    },
  ): StockMovement {
    if (!Number.isFinite(data.quantity) || data.quantity === 0) {
      throw new ValidationError('A movement needs a quantity different from 0.');
    }
    return new StockMovement(
      id,
      new Date(),
      data.supplyId,
      data.supplyName,
      data.type,
      data.quantity,
      data.reference,
      (data.reason ?? '').trim(),
      data.resultingStock,
    );
  }

  static fromPrimitives(p: StockMovementPrimitives): StockMovement {
    return new StockMovement(
      EntityId.of(p.id),
      new Date(p.date),
      EntityId.of(p.supplyId),
      p.supplyName,
      p.type,
      p.quantity,
      p.reference,
      p.reason,
      p.resultingStock,
    );
  }

  toPrimitives(): StockMovementPrimitives {
    return {
      id: this.id.value,
      date: this.date.toISOString(),
      supplyId: this.supplyId.value,
      supplyName: this.supplyName,
      type: this.type,
      quantity: this.quantity,
      reference: this.reference,
      reason: this.reason,
      resultingStock: this.resultingStock,
    };
  }
}
