import { Injectable } from '@angular/core';
import { EntityId } from '../../../_common/entity-id';
import { IndexedDbStore } from '../../../_common/infrastructure/indexeddb/store';
import { RecipeFlavor } from '../../domain/entities/recipe-flavor';
import { RecipeFlavorRepository } from '../../domain/repositories/recipe-flavor.repository';
import { RecipeFlavorMapper } from './recipe-flavor.mapper';
import { RecipeFlavorRecord } from '../records';

/**
 * Implementación IndexedDB de `RecipeFlavorRepository` sobre `IndexedDbStore` (store `flavors`);
 * traduce con `RecipeFlavorMapper`. Se enlaza en `recipe-book.providers.ts`.
 */
@Injectable()
export class IndexedDbRecipeFlavorRepository extends RecipeFlavorRepository {
    private readonly store = new IndexedDbStore<RecipeFlavorRecord>('flavors');

    nextIdentity(): EntityId {
        return new EntityId(crypto.randomUUID());
    }

    async byId(id: EntityId): Promise<RecipeFlavor | null> {
        const record = await this.store.get(id.value);
        return record ? RecipeFlavorMapper.toDomain(record) : null;
    }

    async all(): Promise<RecipeFlavor[]> {
        return (await this.store.all()).map(RecipeFlavorMapper.toDomain);
    }

    async save(flavor: RecipeFlavor): Promise<void> {
        await this.store.put(RecipeFlavorMapper.toRecord(flavor));
    }

    async delete(id: EntityId): Promise<void> {
        await this.store.delete(id.value);
    }
}
