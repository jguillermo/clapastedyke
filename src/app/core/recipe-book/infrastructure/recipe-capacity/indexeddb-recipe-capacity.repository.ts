import { inject, Injectable } from '@angular/core';
import { EntityId } from '../../../_common/entity-id';
import { IndexedDbStore } from '../../../_common/infrastructure/indexeddb/store';
import { Logger } from '../../../_common/logger/logger';
import { CapacityGroup, RecipeCapacity } from '../../domain/entities/recipe-capacity';
import { RecipeCapacityRepository } from '../../domain/repositories/recipe-capacity.repository';
import { RecipeCapacityMapper } from './recipe-capacity.mapper';
import { RecipeCapacityRecord } from '../records';

/**
 * Implementación IndexedDB de `RecipeCapacityRepository` sobre `IndexedDbStore` (store
 * `conversion_options`, nombre físico legacy conservado por retrocompatibilidad); traduce con
 * `RecipeCapacityMapper`. Se enlaza en `recipe-book.providers.ts`.
 */
@Injectable()
export class IndexedDbRecipeCapacityRepository extends RecipeCapacityRepository {
  private readonly store = new IndexedDbStore<RecipeCapacityRecord>('conversion_options');
  private readonly log = inject(Logger).scoped('recipe-book/capacity-repo');

  nextIdentity(): EntityId {
    return new EntityId(crypto.randomUUID());
  }

  async byId(id: EntityId): Promise<RecipeCapacity | null> {
    const record = await this.store.get(id.value);
    return record ? RecipeCapacityMapper.toDomain(record) : null;
  }

  async byGroup(group: CapacityGroup): Promise<RecipeCapacity[]> {
    return (await this.store.all())
      .filter((r) => r.group === group)
      .map(RecipeCapacityMapper.toDomain);
  }

  async all(): Promise<RecipeCapacity[]> {
    const capacities = (await this.store.all()).map(RecipeCapacityMapper.toDomain);
    this.log.debug('capacidades leídas', { count: capacities.length });
    return capacities;
  }

  async save(capacity: RecipeCapacity): Promise<void> {
    await this.store.put(RecipeCapacityMapper.toRecord(capacity));
    this.log.debug('capacidad guardada', { id: capacity.id.value, group: capacity.group });
  }

  async delete(id: EntityId): Promise<void> {
    await this.store.delete(id.value);
    this.log.debug('capacidad borrada', { id: id.value });
  }
}
