import { EntityId } from '../../_common/entity-id';
import { Quantity } from '../../_common/quantity';
import { PackagingRule } from '../domain/entities/packaging-rule';
import { WeightRange } from '../domain/value-objects/weight-range';
import { PackagingRuleMapper } from './packaging-rule.mapper';

describe('PackagingRuleMapper', () => {
    it('round-trips a packaging rule with its weight band', () => {
        const original = PackagingRule.create(
            new EntityId('RL-1'),
            WeightRange.of(Quantity.of(500, 'g'), Quantity.of(1500, 'g')),
            new EntityId('PK-box'),
            new EntityId('PK-base'),
        );

        const restored = PackagingRuleMapper.toDomain(PackagingRuleMapper.toRecord(original));

        expect(restored.equals(original)).toBe(true);
        expect(restored.range.min.value).toBe(500);
        expect(restored.range.max.value).toBe(1500);
        expect(restored.boxId.value).toBe('PK-box');
        expect(restored.matches(Quantity.of(1000, 'g'))).toBe(true);
    });
});
