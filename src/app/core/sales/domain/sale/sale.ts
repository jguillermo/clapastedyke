import { Money } from '../../../_common/domain/money';
import { EntityId } from '../../../_common/domain/entity-id';

export interface SalePrimitives {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  amountSoles: number;
  date: string; // ISO
}

/**
 * Sale (VT-): the cycle closing. It is born on its own when an order is
 * DELIVERED, with the FROZEN final price of the originating quote. Immutable.
 */
export class Sale {
  private constructor(
    readonly id: EntityId,
    readonly orderId: EntityId,
    readonly customerId: EntityId,
    readonly customerName: string,
    readonly amount: Money,
    readonly date: Date,
  ) {}

  static register(
    id: EntityId,
    data: { orderId: EntityId; customerId: EntityId; customerName: string; amount: Money },
  ): Sale {
    return new Sale(id, data.orderId, data.customerId, data.customerName, data.amount, new Date());
  }

  static fromPrimitives(p: SalePrimitives): Sale {
    return new Sale(
      EntityId.of(p.id),
      EntityId.of(p.orderId),
      EntityId.of(p.customerId),
      p.customerName,
      Money.fromSoles(p.amountSoles),
      new Date(p.date),
    );
  }

  toPrimitives(): SalePrimitives {
    return {
      id: this.id.value,
      orderId: this.orderId.value,
      customerId: this.customerId.value,
      customerName: this.customerName,
      amountSoles: this.amount.soles,
      date: this.date.toISOString(),
    };
  }
}
