import { EntityId, ID_PREFIXES, IdGenerator } from '../../shared/domain/entity-id';
import { IndexedDbStore } from '../../shared/infrastructure/indexeddb/store';
import { Order, OrderPrimitives } from '../domain/order/order';
import { OrderRepository } from '../domain/order/order-repository';
import { Quote, QuotePrimitives } from '../domain/quote/quote';
import { QuoteRepository } from '../domain/quote/quote-repository';
import { Sale, SalePrimitives } from '../domain/sale/sale';
import { SaleRepository } from '../domain/sale/sale-repository';

/** Persists the quote (with its frozen detail) in the browser. */
export class IndexedDbQuoteRepository implements QuoteRepository {
  private readonly store = new IndexedDbStore<QuotePrimitives>('quotes');
  constructor(private readonly ids: IdGenerator) {}

  nextId() {
    return this.ids.next(ID_PREFIXES.quote);
  }
  async byId(id: EntityId) {
    const doc = await this.store.get(id.value);
    return doc ? Quote.fromPrimitives(doc) : null;
  }
  async save(quote: Quote) {
    await this.store.put(quote.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(Quote.fromPrimitives);
  }
}

export class IndexedDbOrderRepository implements OrderRepository {
  private readonly store = new IndexedDbStore<OrderPrimitives>('orders');
  constructor(private readonly ids: IdGenerator) {}

  nextId() {
    return this.ids.next(ID_PREFIXES.order);
  }
  async byId(id: EntityId) {
    const doc = await this.store.get(id.value);
    return doc ? Order.fromPrimitives(doc) : null;
  }
  async save(order: Order) {
    await this.store.put(order.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(Order.fromPrimitives);
  }
}

export class IndexedDbSaleRepository implements SaleRepository {
  private readonly store = new IndexedDbStore<SalePrimitives>('sales');
  constructor(private readonly ids: IdGenerator) {}

  nextId() {
    return this.ids.next(ID_PREFIXES.sale);
  }
  async save(sale: Sale) {
    await this.store.put(sale.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(Sale.fromPrimitives);
  }
}
