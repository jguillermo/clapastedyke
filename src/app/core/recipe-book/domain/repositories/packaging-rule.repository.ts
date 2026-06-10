import { EntityId } from '../../../_common/entity-id';
import { PackagingRule } from '../entities/packaging-rule';

export abstract class PackagingRuleRepository {
    abstract nextIdentity(): EntityId;
    abstract byId(id: EntityId): Promise<PackagingRule | null>;
    abstract save(rule: PackagingRule): Promise<void>;
    abstract all(): Promise<PackagingRule[]>;
}
