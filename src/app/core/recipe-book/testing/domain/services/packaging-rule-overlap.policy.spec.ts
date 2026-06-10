import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { PackagingRule } from '../../../domain/entities/packaging-rule';
import { WeightRange } from '../../../domain/value-objects/weight-range';
import { PackagingRuleOverlapPolicy } from '../../../domain/services/packaging-rule-overlap.policy';

const range = (min: number, max: number) => WeightRange.of(Quantity.of(min, 'g'), Quantity.of(max, 'g'));
const rule = (id: string, min: number, max: number) =>
    PackagingRule.create(new EntityId(id), range(min, max), new EntityId('PK-box'), new EntityId('PK-base'));

describe('PackagingRuleOverlapPolicy', () => {
    const policy = new PackagingRuleOverlapPolicy();

    it('allows a band that does not overlap any existing rule', () => {
        const existing = [rule('RL-1', 500, 1500)];
        expect(() => policy.ensureNoOverlap(range(1501, 2500), existing)).not.toThrow();
    });

    it('throws when the candidate band overlaps an existing rule', () => {
        const existing = [rule('RL-1', 500, 1500)];
        expect(() => policy.ensureNoOverlap(range(1000, 2000), existing)).toThrow();
    });

    it('allows the first rule when the collection is empty', () => {
        expect(() => policy.ensureNoOverlap(range(500, 1500), [])).not.toThrow();
    });
});
