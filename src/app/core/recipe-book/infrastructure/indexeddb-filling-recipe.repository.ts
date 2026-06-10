import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { FillingRecipe } from '../domain/entities/filling-recipe';
import { FillingRecipeRepository } from '../domain/repositories/filling-recipe.repository';
import { FillingRecipeMapper } from './filling-recipe.mapper';
import { FillingRecipeRecord } from './records';

@Injectable()
export class IndexedDbFillingRecipeRepository extends FillingRecipeRepository {
    private readonly store = new IndexedDbStore<FillingRecipeRecord>('filling_recipes');

    nextIdentity(): EntityId {
        return new EntityId(crypto.randomUUID());
    }

    async byId(id: EntityId): Promise<FillingRecipe | null> {
        const record = await this.store.get(id.value);
        return record ? FillingRecipeMapper.toDomain(record) : null;
    }

    async byName(name: string): Promise<FillingRecipe | null> {
        const target = name.trim().toLowerCase();
        const record = (await this.store.all()).find((r) => r.name.toLowerCase() === target);
        return record ? FillingRecipeMapper.toDomain(record) : null;
    }

    async save(recipe: FillingRecipe): Promise<void> {
        await this.store.put(FillingRecipeMapper.toRecord(recipe));
    }

    async all(): Promise<FillingRecipe[]> {
        return (await this.store.all()).map(FillingRecipeMapper.toDomain);
    }
}
