import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { WeightRange } from '../../../domain/value-objects/weight-range';
import { PackagingRule } from '../../../domain/entities/packaging-rule';

const rule = PackagingRule.create(
    new EntityId('RL-1'),
    WeightRange.of(Quantity.of(500, 'g'), Quantity.of(1500, 'g')),
    new EntityId('PK-box'),
    new EntityId('PK-base'),
);

describe('PackagingRule', () => {
    it('matches weights inside its band', () => {
        expect(rule.matches(Quantity.of(1000, 'g'))).toBe(true);
        expect(rule.matches(Quantity.of(500, 'g'))).toBe(true);
        expect(rule.matches(Quantity.of(1500, 'g'))).toBe(true);
    });

    it('does not match weights outside its band', () => {
        expect(rule.matches(Quantity.of(2000, 'g'))).toBe(false);
        expect(rule.matches(Quantity.of(100, 'g'))).toBe(false);
    });

    it('is equal by id', () => {
        const other = PackagingRule.create(
            new EntityId('RL-1'),
            WeightRange.of(Quantity.of(2000, 'g'), Quantity.of(3000, 'g')),
            new EntityId('PK-x'),
            new EntityId('PK-y'),
        );
        expect(rule.equals(other)).toBe(true);
    });
});
