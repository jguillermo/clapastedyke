import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { Flavor } from '../domain/entities/flavor';
import { FlavorRepository } from '../domain/repositories/flavor.repository';
import { FlavorMapper } from './flavor.mapper';
import { FlavorRecord } from './records';

@Injectable()
export class IndexedDbFlavorRepository extends FlavorRepository {
    private readonly store = new IndexedDbStore<FlavorRecord>('flavors');

    nextIdentity(): EntityId {
        return new EntityId(crypto.randomUUID());
    }

    async byId(id: EntityId): Promise<Flavor | null> {
        const record = await this.store.get(id.value);
        return record ? FlavorMapper.toDomain(record) : null;
    }

    async all(): Promise<Flavor[]> {
        return (await this.store.all()).map(FlavorMapper.toDomain);
    }

    async save(flavor: Flavor): Promise<void> {
        await this.store.put(FlavorMapper.toRecord(flavor));
    }

    async delete(id: EntityId): Promise<void> {
        await this.store.delete(id.value);
    }
}
