import { IdGenerator, ID_PREFIXES } from '../../_common/domain/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { Production, ProductionPrimitives } from '../domain/production/production';
import { ProductionRepository } from '../domain/production/production-repository';

export class IndexedDbProductionRepository implements ProductionRepository {
  private readonly store = new IndexedDbStore<ProductionPrimitives>('productions');
  constructor(private readonly ids: IdGenerator) {}

  nextId() {
    return this.ids.next(ID_PREFIXES.production);
  }
  async save(production: Production) {
    await this.store.put(production.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(Production.fromPrimitives);
  }
}
