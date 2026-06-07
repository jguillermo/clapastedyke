import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { PackagingRule } from '../domain/entities/packaging-rule';
import { PackagingRuleRepository } from '../domain/repositories/packaging-rule.repository';
import { PackagingRuleMapper } from './packaging-rule.mapper';
import { PackagingRuleRecord } from './records';

@Injectable()
export class IndexedDbPackagingRuleRepository extends PackagingRuleRepository {
    private readonly store = new IndexedDbStore<PackagingRuleRecord>('packaging_rules');

    nextIdentity(): EntityId {
        return new EntityId(crypto.randomUUID());
    }

    async byId(id: EntityId): Promise<PackagingRule | null> {
        const record = await this.store.get(id.value);
        return record ? PackagingRuleMapper.toDomain(record) : null;
    }

    async save(rule: PackagingRule): Promise<void> {
        await this.store.put(PackagingRuleMapper.toRecord(rule));
    }

    async all(): Promise<PackagingRule[]> {
        return (await this.store.all()).map(PackagingRuleMapper.toDomain);
    }
}
