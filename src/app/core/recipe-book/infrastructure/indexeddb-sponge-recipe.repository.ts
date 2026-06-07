import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { SpongeRecipe } from '../domain/entities/sponge-recipe';
import { SpongeRecipeRepository } from '../domain/repositories/sponge-recipe.repository';
import { SpongeRecipeMapper } from './sponge-recipe.mapper';
import { SpongeRecipeRecord } from './records';

@Injectable()
export class IndexedDbSpongeRecipeRepository extends SpongeRecipeRepository {
    private readonly store = new IndexedDbStore<SpongeRecipeRecord>('sponge_recipes');

    nextIdentity(): EntityId {
        return new EntityId(crypto.randomUUID());
    }

    async byId(id: EntityId): Promise<SpongeRecipe | null> {
        const record = await this.store.get(id.value);
        return record ? SpongeRecipeMapper.toDomain(record) : null;
    }

    async byName(name: string): Promise<SpongeRecipe | null> {
        const target = name.trim().toLowerCase();
        const record = (await this.store.all()).find((r) => r.name.toLowerCase() === target);
        return record ? SpongeRecipeMapper.toDomain(record) : null;
    }

    async save(recipe: SpongeRecipe): Promise<void> {
        await this.store.put(SpongeRecipeMapper.toRecord(recipe));
    }

    async all(): Promise<SpongeRecipe[]> {
        return (await this.store.all()).map(SpongeRecipeMapper.toDomain);
    }
}
