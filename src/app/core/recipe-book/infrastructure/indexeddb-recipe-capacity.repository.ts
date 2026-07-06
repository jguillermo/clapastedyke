import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { CapacityGroup, RecipeCapacity } from '../domain/entities/recipe-capacity';
import { RecipeCapacityRepository } from '../domain/repositories/recipe-capacity.repository';
import { RecipeCapacityMapper } from './recipe-capacity.mapper';
import { RecipeCapacityRecord } from './records';

/**
 * Implementación IndexedDB de `RecipeCapacityRepository` sobre `IndexedDbStore` (store
 * `conversion_options`, nombre físico legacy conservado por retrocompatibilidad); traduce con
 * `RecipeCapacityMapper`. Se enlaza en `recipe-book.providers.ts`.
 */
@Injectable()
export class IndexedDbRecipeCapacityRepository extends RecipeCapacityRepository {
    private readonly store = new IndexedDbStore<RecipeCapacityRecord>('conversion_options');

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
        return (await this.store.all()).map(RecipeCapacityMapper.toDomain);
    }

    async save(capacity: RecipeCapacity): Promise<void> {
        await this.store.put(RecipeCapacityMapper.toRecord(capacity));
    }

    async delete(id: EntityId): Promise<void> {
        await this.store.delete(id.value);
    }
}
