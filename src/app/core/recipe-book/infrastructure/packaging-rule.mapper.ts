import { EntityId } from '../../_common/entity-id';
import { PackagingRule } from '../domain/entities/packaging-rule';
import { WeightRange } from '../domain/value-objects/weight-range';
import { PackagingRuleRecord } from './records';
import { quantityToDomain, quantityToRecord } from './value-record.mappers';

export const PackagingRuleMapper = {
    toRecord(rule: PackagingRule): PackagingRuleRecord {
        return {
            id: rule.id.value,
            range: { min: quantityToRecord(rule.range.min), max: quantityToRecord(rule.range.max) },
            boxId: rule.boxId.value,
            baseId: rule.baseId.value,
        };
    },

    toDomain(record: PackagingRuleRecord): PackagingRule {
        const range = WeightRange.of(quantityToDomain(record.range.min), quantityToDomain(record.range.max));
        return PackagingRule.create(new EntityId(record.id), range, new EntityId(record.boxId), new EntityId(record.baseId));
    },
};
