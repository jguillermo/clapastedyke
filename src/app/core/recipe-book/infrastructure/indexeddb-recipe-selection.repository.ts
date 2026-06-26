import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { RecipeSelection } from '../domain/entities/recipe-selection';
import { RecipeSelectionRepository } from '../domain/repositories/recipe-selection.repository';
import { RecipeSelectionMapper } from './recipe-selection.mapper';
import { RecipeSelectionRecord } from './records';

@Injectable()
export class IndexedDbRecipeSelectionRepository extends RecipeSelectionRepository {
    private readonly store = new IndexedDbStore<RecipeSelectionRecord>('recipe_selections');

    nextIdentity(): EntityId {
        return new EntityId(crypto.randomUUID());
    }

    async byId(id: EntityId): Promise<RecipeSelection | null> {
        const record = await this.store.get(id.value);
        return record ? RecipeSelectionMapper.toDomain(record) : null;
    }

    async byRecipe(recipeId: EntityId): Promise<RecipeSelection[]> {
        return (await this.store.all())
            .filter((r) => r.recipeId === recipeId.value)
            .map(RecipeSelectionMapper.toDomain);
    }

    async all(): Promise<RecipeSelection[]> {
        return (await this.store.all()).map(RecipeSelectionMapper.toDomain);
    }

    async save(selection: RecipeSelection): Promise<void> {
        await this.store.put(RecipeSelectionMapper.toRecord(selection));
    }
}
