import { EntityId } from '../../_common/entity-id';
import { PackagingItem } from '../domain/entities/packaging-item';
import { PackagingItemRecord } from './records';

export const PackagingItemMapper = {
    toRecord(item: PackagingItem): PackagingItemRecord {
        return { id: item.id.value, name: item.name, type: item.type };
    },

    toDomain(record: PackagingItemRecord): PackagingItem {
        return PackagingItem.create(new EntityId(record.id), record.name, record.type);
    },
};
