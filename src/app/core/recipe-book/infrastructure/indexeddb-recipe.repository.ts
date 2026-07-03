import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { Recipe } from '../domain/entities/recipe';
import { RecipeRepository } from '../domain/repositories/recipe.repository';
import { RecipeMapper } from './recipe.mapper';
import { RecipeRecord } from './records';

@Injectable()
export class IndexedDbRecipeRepository extends RecipeRepository {
    private readonly store = new IndexedDbStore<RecipeRecord>('recipes');

    nextIdentity(): EntityId {
        return new EntityId(crypto.randomUUID());
    }

    async byId(id: EntityId): Promise<Recipe | null> {
        const record = await this.store.get(id.value);
        return record ? RecipeMapper.toDomain(record) : null;
    }

    async byNameInCategory(categoryId: EntityId, name: string): Promise<Recipe | null> {
        const target = name.trim().toLowerCase();
        const record = (await this.store.all()).find(
            (r) => r.categoryId === categoryId.value && r.name.toLowerCase() === target,
        );
        return record ? RecipeMapper.toDomain(record) : null;
    }

    async byCategory(categoryId: EntityId): Promise<Recipe[]> {
        return (await this.store.all())
            .filter((r) => r.categoryId === categoryId.value)
            .map(RecipeMapper.toDomain);
    }

    async save(recipe: Recipe): Promise<void> {
        await this.store.put(RecipeMapper.toRecord(recipe));
    }

    async all(): Promise<Recipe[]> {
        return (await this.store.all()).map(RecipeMapper.toDomain);
    }
}
