import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { Topper } from '../domain/entities/topper';
import { TopperRepository } from '../domain/repositories/topper.repository';
import { TopperMapper } from './topper.mapper';
import { TopperRecord } from './records';

@Injectable()
export class IndexedDbTopperRepository extends TopperRepository {
    private readonly store = new IndexedDbStore<TopperRecord>('toppers');

    nextIdentity(): EntityId {
        return new EntityId(crypto.randomUUID());
    }

    async byId(id: EntityId): Promise<Topper | null> {
        const record = await this.store.get(id.value);
        return record ? TopperMapper.toDomain(record) : null;
    }

    async byName(name: string): Promise<Topper | null> {
        const target = name.trim().toLowerCase();
        const record = (await this.store.all()).find((r) => r.name.toLowerCase() === target);
        return record ? TopperMapper.toDomain(record) : null;
    }

    async save(topper: Topper): Promise<void> {
        await this.store.put(TopperMapper.toRecord(topper));
    }

    async all(): Promise<Topper[]> {
        return (await this.store.all()).map(TopperMapper.toDomain);
    }
}
