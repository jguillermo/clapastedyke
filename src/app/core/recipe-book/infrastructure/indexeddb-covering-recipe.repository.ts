import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { CoveringRecipe } from '../domain/entities/covering-recipe';
import { CoveringRecipeRepository } from '../domain/repositories/covering-recipe.repository';
import { CoveringRecipeMapper } from './covering-recipe.mapper';
import { CoveringRecipeRecord } from './records';

@Injectable()
export class IndexedDbCoveringRecipeRepository extends CoveringRecipeRepository {
    private readonly store = new IndexedDbStore<CoveringRecipeRecord>('covering_recipes');

    nextIdentity(): EntityId {
        return new EntityId(crypto.randomUUID());
    }

    async byId(id: EntityId): Promise<CoveringRecipe | null> {
        const record = await this.store.get(id.value);
        return record ? CoveringRecipeMapper.toDomain(record) : null;
    }

    async byName(name: string): Promise<CoveringRecipe | null> {
        const target = name.trim().toLowerCase();
        const record = (await this.store.all()).find((r) => r.name.toLowerCase() === target);
        return record ? CoveringRecipeMapper.toDomain(record) : null;
    }

    async save(recipe: CoveringRecipe): Promise<void> {
        await this.store.put(CoveringRecipeMapper.toRecord(recipe));
    }

    async all(): Promise<CoveringRecipe[]> {
        return (await this.store.all()).map(CoveringRecipeMapper.toDomain);
    }
}
