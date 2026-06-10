import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { CakeComposition } from '../domain/entities/cake-composition';
import { CakeCompositionRepository } from '../domain/repositories/cake-composition.repository';
import { CakeCompositionMapper } from './cake-composition.mapper';
import { CakeCompositionRecord } from './records';

@Injectable()
export class IndexedDbCakeCompositionRepository extends CakeCompositionRepository {
    private readonly store = new IndexedDbStore<CakeCompositionRecord>('cake_compositions');

    nextIdentity(): EntityId {
        return new EntityId(crypto.randomUUID());
    }

    async byId(id: EntityId): Promise<CakeComposition | null> {
        const record = await this.store.get(id.value);
        return record ? CakeCompositionMapper.toDomain(record) : null;
    }

    async save(composition: CakeComposition): Promise<void> {
        await this.store.put(CakeCompositionMapper.toRecord(composition));
    }

    async all(): Promise<CakeComposition[]> {
        return (await this.store.all()).map(CakeCompositionMapper.toDomain);
    }
}
