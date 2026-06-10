import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { Ingredient } from '../domain/entities/ingredient';
import { IngredientRepository } from '../domain/repositories/ingredient.repository';
import { IngredientMapper } from './ingredient.mapper';
import { IngredientRecord } from './records';

@Injectable()
export class IndexedDbIngredientRepository extends IngredientRepository {
    private readonly store = new IndexedDbStore<IngredientRecord>('ingredients');

    nextIdentity(): EntityId {
        return new EntityId(crypto.randomUUID());
    }

    async byId(id: EntityId): Promise<Ingredient | null> {
        const record = await this.store.get(id.value);
        return record ? IngredientMapper.toDomain(record) : null;
    }

    async byName(name: string): Promise<Ingredient | null> {
        const target = name.trim().toLowerCase();
        const record = (await this.store.all()).find((r) => r.name.toLowerCase() === target);
        return record ? IngredientMapper.toDomain(record) : null;
    }

    async save(ingredient: Ingredient): Promise<void> {
        await this.store.put(IngredientMapper.toRecord(ingredient));
    }

    async all(): Promise<Ingredient[]> {
        return (await this.store.all()).map(IngredientMapper.toDomain);
    }
}
