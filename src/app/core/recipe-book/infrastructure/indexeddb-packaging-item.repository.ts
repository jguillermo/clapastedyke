import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { PackagingItem } from '../domain/entities/packaging-item';
import { PackagingItemRepository } from '../domain/repositories/packaging-item.repository';
import { PackagingItemMapper } from './packaging-item.mapper';
import { PackagingItemRecord } from './records';

@Injectable()
export class IndexedDbPackagingItemRepository extends PackagingItemRepository {
    private readonly store = new IndexedDbStore<PackagingItemRecord>('packaging_items');

    nextIdentity(): EntityId {
        return new EntityId(crypto.randomUUID());
    }

    async byId(id: EntityId): Promise<PackagingItem | null> {
        const record = await this.store.get(id.value);
        return record ? PackagingItemMapper.toDomain(record) : null;
    }

    async byName(name: string): Promise<PackagingItem | null> {
        const target = name.trim().toLowerCase();
        const record = (await this.store.all()).find((r) => r.name.toLowerCase() === target);
        return record ? PackagingItemMapper.toDomain(record) : null;
    }

    async save(item: PackagingItem): Promise<void> {
        await this.store.put(PackagingItemMapper.toRecord(item));
    }

    async all(): Promise<PackagingItem[]> {
        return (await this.store.all()).map(PackagingItemMapper.toDomain);
    }
}
