import { AggregateRoot } from '../../_common/domain/aggregate';
import { domainEvent } from '../../_common/domain/domain-event';
import { EntityId } from '../../_common/domain/entity-id';

export interface InformalOrderPrimitives {
  id: string;
  recipeName: string;
  date: string;
}

/**
 * InformalOrder (INF-): pequeño pedido informal que llega por la popularidad
 * (aún sin clientes formales). Al atenderse emite InformalOrderReceived.
 */
export class InformalOrder extends AggregateRoot {
  private constructor(
    readonly id: EntityId,
    readonly recipeName: string,
    readonly date: Date,
  ) {
    super();
  }

  static receive(id: EntityId, data: { recipeName: string }): InformalOrder {
    const order = new InformalOrder(id, data.recipeName, new Date());
    order.recordEvent(domainEvent('InformalOrderReceived', id.value, { recipeName: data.recipeName }));
    return order;
  }

  static fromPrimitives(p: InformalOrderPrimitives): InformalOrder {
    return new InformalOrder(EntityId.of(p.id), p.recipeName, new Date(p.date));
  }

  toPrimitives(): InformalOrderPrimitives {
    return { id: this.id.value, recipeName: this.recipeName, date: this.date.toISOString() };
  }
}
