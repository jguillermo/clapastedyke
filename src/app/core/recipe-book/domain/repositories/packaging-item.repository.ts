import { EntityId } from '../../../_common/entity-id';
import { PackagingItem } from '../entities/packaging-item';

export abstract class PackagingItemRepository {
    abstract nextIdentity(): EntityId;
    abstract byId(id: EntityId): Promise<PackagingItem | null>;
    abstract byName(name: string): Promise<PackagingItem | null>;
    abstract save(item: PackagingItem): Promise<void>;
    abstract all(): Promise<PackagingItem[]>;
}
