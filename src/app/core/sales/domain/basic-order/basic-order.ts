import { AggregateRoot } from '../../../_common/domain/aggregate';
import { ValidationError } from '../../../_common/domain/errors';
import { domainEvent } from '../../../_common/domain/domain-event';
import { EntityId } from '../../../_common/domain/entity-id';

export type BasicOrderStatus = 'Pending' | 'Delivered';

export interface BasicOrderPrimitives {
  id: string;
  customerId: string;
  customerName: string;
  recipeId: string;
  recipeName: string;
  priceSoles: number;
  status: BasicOrderStatus;
  createdAt: string;
  deliveredAt: string | null;
}

/**
 * BasicOrder (PDB-): pedido del modo básico (Fase 3), sin presupuesto. Flujo
 * mínimo Cliente → Pedido → Entrega → Cobro. Precio puesto a mano; al entregar
 * se registra la venta. El pedido avanzado con presupuesto/requerimientos llega
 * en la Fase 5 (entidad Order).
 */
export class BasicOrder extends AggregateRoot {
  private constructor(
    readonly id: EntityId,
    readonly customerId: EntityId,
    readonly customerName: string,
    readonly recipeId: string,
    readonly recipeName: string,
    readonly priceSoles: number,
    private _status: BasicOrderStatus,
    readonly createdAt: Date,
    private _deliveredAt: Date | null,
  ) {
    super();
  }

  static place(
    id: EntityId,
    data: {
      customerId: EntityId;
      customerName: string;
      recipeId: string;
      recipeName: string;
      priceSoles: number;
    },
  ): BasicOrder {
    if (!(data.priceSoles > 0)) throw new ValidationError('The order price must be greater than 0.');
    const order = new BasicOrder(
      id,
      data.customerId,
      data.customerName,
      data.recipeId,
      data.recipeName,
      data.priceSoles,
      'Pending',
      new Date(),
      null,
    );
    order.recordEvent(domainEvent('OrderCreated', id.value, { customerId: data.customerId.value }));
    return order;
  }

  static fromPrimitives(p: BasicOrderPrimitives): BasicOrder {
    return new BasicOrder(
      EntityId.of(p.id),
      EntityId.of(p.customerId),
      p.customerName,
      p.recipeId,
      p.recipeName,
      p.priceSoles,
      p.status,
      new Date(p.createdAt),
      p.deliveredAt ? new Date(p.deliveredAt) : null,
    );
  }

  /** Entrega y cobro: marca entregado (la venta la registra el caso de uso). */
  deliver(): void {
    if (this._status !== 'Pending') {
      throw new ValidationError(`Can only deliver a Pending order (it is ${this._status}).`);
    }
    this._status = 'Delivered';
    this._deliveredAt = new Date();
    this.recordEvent(domainEvent('OrderDelivered', this.id.value, {}));
  }

  get status(): BasicOrderStatus {
    return this._status;
  }

  toPrimitives(): BasicOrderPrimitives {
    return {
      id: this.id.value,
      customerId: this.customerId.value,
      customerName: this.customerName,
      recipeId: this.recipeId,
      recipeName: this.recipeName,
      priceSoles: this.priceSoles,
      status: this._status,
      createdAt: this.createdAt.toISOString(),
      deliveredAt: this._deliveredAt?.toISOString() ?? null,
    };
  }
}
