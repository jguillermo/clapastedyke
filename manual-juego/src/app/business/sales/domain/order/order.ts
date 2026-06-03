import { AggregateRoot } from '../../../shared/domain/aggregate';
import { ValidationError } from '../../../shared/domain/errors';
import { domainEvent } from '../../../shared/domain/domain-event';
import { EntityId } from '../../../shared/domain/entity-id';

export type OrderStatus = 'Pending' | 'InProduction' | 'Delivered' | 'Cancelled';

/**
 * Material requirement (the GAS REQ-, internal to the aggregate).
 * `shortage` is a SNAPSHOT of the creation moment: it is not recomputed.
 */
export interface OrderRequirement {
  supplyId: string;
  supplyName: string;
  requiredQuantity: number;
  shortage: number;
}

export interface OrderPrimitives {
  id: string;
  quoteId: string;
  customerId: string;
  customerName: string;
  recipeName: string;
  status: OrderStatus;
  requirements: OrderRequirement[];
  stockDeducted: boolean;
  createdAt: string; // ISO
  deliveredAt: string | null;
  cancellationReason: string;
}

/**
 * Order (PD-): the order born when a quote is approved (1:1).
 * Transitions: Pending → InProduction → Delivered · Pending/InProduction →
 * Cancelled (returns stock). A Delivered order is NEVER cancelled.
 * `stockDeducted` makes the deduction idempotent (ON_APPROVAL or
 * ON_PRODUCTION moment per settings, without deducting twice).
 */
export class Order extends AggregateRoot {
  private constructor(
    readonly id: EntityId,
    readonly quoteId: EntityId,
    readonly customerId: EntityId,
    readonly customerName: string,
    readonly recipeName: string,
    private _status: OrderStatus,
    private _requirements: OrderRequirement[],
    private _stockDeducted: boolean,
    readonly createdAt: Date,
    private _deliveredAt: Date | null,
    private _cancellationReason: string,
  ) {
    super();
  }

  static create(
    id: EntityId,
    data: {
      quoteId: EntityId;
      customerId: EntityId;
      customerName: string;
      recipeName: string;
      requirements: OrderRequirement[];
    },
  ): Order {
    const order = new Order(
      id,
      data.quoteId,
      data.customerId,
      data.customerName,
      data.recipeName,
      'Pending',
      data.requirements.map(r => ({ ...r })),
      false,
      new Date(),
      null,
      '',
    );
    order.recordEvent(
      domainEvent('OrderCreated', id.value, { quoteId: data.quoteId.value }),
    );
    return order;
  }

  static fromPrimitives(p: OrderPrimitives): Order {
    return new Order(
      EntityId.of(p.id),
      EntityId.of(p.quoteId),
      EntityId.of(p.customerId),
      p.customerName,
      p.recipeName,
      p.status,
      p.requirements.map(r => ({ ...r })),
      p.stockDeducted,
      new Date(p.createdAt),
      p.deliveredAt ? new Date(p.deliveredAt) : null,
      p.cancellationReason,
    );
  }

  /* ---------- Transitions ---------- */

  startProduction(): void {
    this.requireStatus('Pending', 'start production for');
    this._status = 'InProduction';
    this.recordEvent(domainEvent('OrderInProduction', this.id.value, {}));
  }

  markDelivered(): void {
    this.requireStatus('InProduction', 'deliver');
    this._status = 'Delivered';
    this._deliveredAt = new Date();
    this.recordEvent(domainEvent('OrderDelivered', this.id.value, {}));
  }

  cancel(reason: string): void {
    if (this._status !== 'Pending' && this._status !== 'InProduction') {
      throw new ValidationError(
        `Can only cancel a Pending or InProduction order (it is ${this._status}).`,
      );
    }
    this._status = 'Cancelled';
    this._cancellationReason = (reason ?? '').trim();
    this.recordEvent(
      domainEvent('OrderCancelled', this.id.value, { reason: this._cancellationReason }),
    );
  }

  /** Deduction idempotency: returns true only the first time. */
  markStockDeducted(): boolean {
    if (this._stockDeducted) return false;
    this._stockDeducted = true;
    return true;
  }

  /* ---------- Queries ---------- */

  get status(): OrderStatus {
    return this._status;
  }
  get requirements(): readonly OrderRequirement[] {
    return this._requirements;
  }
  get stockDeducted(): boolean {
    return this._stockDeducted;
  }
  get deliveredAt(): Date | null {
    return this._deliveredAt;
  }
  get cancellationReason(): string {
    return this._cancellationReason;
  }

  toPrimitives(): OrderPrimitives {
    return {
      id: this.id.value,
      quoteId: this.quoteId.value,
      customerId: this.customerId.value,
      customerName: this.customerName,
      recipeName: this.recipeName,
      status: this._status,
      requirements: this._requirements.map(r => ({ ...r })),
      stockDeducted: this._stockDeducted,
      createdAt: this.createdAt.toISOString(),
      deliveredAt: this._deliveredAt?.toISOString() ?? null,
      cancellationReason: this._cancellationReason,
    };
  }

  private requireStatus(expected: OrderStatus, action: string): void {
    if (this._status !== expected) {
      throw new ValidationError(
        `Can only ${action} a ${expected} order (it is ${this._status}).`,
      );
    }
  }
}
