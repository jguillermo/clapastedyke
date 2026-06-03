import { AggregateRoot } from '../../../shared/domain/aggregate';
import { ValidationError } from '../../../shared/domain/errors';
import { domainEvent } from '../../../shared/domain/domain-event';
import { EntityId } from '../../../shared/domain/entity-id';

/** Purchase line (the GAS CDL-, internal to the aggregate). */
export interface PurchaseLine {
  supplyId: string;
  supplyName: string;
  /** Quantity of PRESENTATIONS received (5 bags, not 5000 g). */
  receivedPresentations: number;
  /** Price paid per presentation (may differ from the registered one). */
  paidPresentationPriceSoles: number;
  /** Presentation size of the supply on that date (captured). */
  presentationSize: number;
  /** Computed: receivedPresentations × presentationSize. */
  baseUnitQuantity: number;
  /** Computed: paidPrice ÷ presentationSize. */
  pricePerBaseUnitSoles: number;
}

export interface PurchasePrimitives {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string; // ISO
  lines: PurchaseLine[];
}

/**
 * Purchase (CMP-): receipt of materials from a supplier. IMMUTABLE history:
 * its effect on the supply's stock and prices is applied by the use case via
 * StockService; here we keep the snapshot of what was received and paid.
 */
export class Purchase extends AggregateRoot {
  private constructor(
    readonly id: EntityId,
    readonly supplierId: EntityId,
    readonly supplierName: string,
    readonly date: Date,
    readonly lines: readonly PurchaseLine[],
  ) {
    super();
  }

  static register(
    id: EntityId,
    data: {
      supplierId: EntityId;
      supplierName: string;
      date?: Date;
      lines: {
        supplyId: string;
        supplyName: string;
        receivedPresentations: number;
        paidPresentationPriceSoles: number;
        presentationSize: number;
      }[];
    },
  ): Purchase {
    if (!data.lines?.length) {
      throw new ValidationError('A purchase needs at least one line.');
    }
    const lines = data.lines.map(l => {
      if (l.receivedPresentations <= 0) {
        throw new ValidationError(`Invalid received quantity for ${l.supplyName}.`);
      }
      if (l.paidPresentationPriceSoles <= 0) {
        throw new ValidationError(`Invalid paid price for ${l.supplyName}.`);
      }
      return {
        ...l,
        baseUnitQuantity: l.receivedPresentations * l.presentationSize,
        pricePerBaseUnitSoles: l.paidPresentationPriceSoles / l.presentationSize,
      } satisfies PurchaseLine;
    });

    const purchase = new Purchase(
      id,
      data.supplierId,
      data.supplierName,
      data.date ?? new Date(),
      lines,
    );
    purchase.recordEvent(
      domainEvent('PurchaseRegistered', id.value, {
        supplierId: data.supplierId.value,
        lines: lines.length,
      }),
    );
    return purchase;
  }

  static fromPrimitives(p: PurchasePrimitives): Purchase {
    return new Purchase(
      EntityId.of(p.id),
      EntityId.of(p.supplierId),
      p.supplierName,
      new Date(p.date),
      p.lines.map(l => ({ ...l })),
    );
  }

  toPrimitives(): PurchasePrimitives {
    return {
      id: this.id.value,
      supplierId: this.supplierId.value,
      supplierName: this.supplierName,
      date: this.date.toISOString(),
      lines: this.lines.map(l => ({ ...l })),
    };
  }
}
