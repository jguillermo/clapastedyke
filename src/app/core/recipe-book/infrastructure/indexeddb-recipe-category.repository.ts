import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { RecipeCategory } from '../domain/entities/recipe-category';
import { RecipeCategoryRepository } from '../domain/repositories/recipe-category.repository';
import { RecipeCategoryMapper } from './recipe-category.mapper';
import { RecipeCategoryRecord } from './records';

@Injectable()
export class IndexedDbRecipeCategoryRepository extends RecipeCategoryRepository {
    private readonly store = new IndexedDbStore<RecipeCategoryRecord>('recipe_categories');

    nextIdentity(): EntityId {
        return new EntityId(crypto.randomUUID());
    }

    async byId(id: EntityId): Promise<RecipeCategory | null> {
        const record = await this.store.get(id.value);
        return record ? RecipeCategoryMapper.toDomain(record) : null;
    }

    async byName(name: string): Promise<RecipeCategory | null> {
        const target = name.trim().toLowerCase();
        const record = (await this.store.all()).find((r) => r.name.toLowerCase() === target);
        return record ? RecipeCategoryMapper.toDomain(record) : null;
    }

    async save(category: RecipeCategory): Promise<void> {
        await this.store.put(RecipeCategoryMapper.toRecord(category));
    }

    async all(): Promise<RecipeCategory[]> {
        return (await this.store.all()).map(RecipeCategoryMapper.toDomain);
    }
}
